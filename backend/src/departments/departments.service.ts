import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { Membership, User, UserDocument } from '../users/schemas/user.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

const USER_FIELDS = 'fullName email role profileImage';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  findAll() {
    return this.departmentModel
      .find()
      .populate('manager', USER_FIELDS)
      .populate('viceManager', USER_FIELDS)
      .populate('teamManagers', USER_FIELDS)
      .populate('members', USER_FIELDS)
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string) {
    this.validateDepartmentId(id);
    const department = await this.departmentModel
      .findById(id)
      .populate('manager', USER_FIELDS)
      .populate('viceManager', USER_FIELDS)
      .populate('teamManagers', USER_FIELDS)
      .populate('members', USER_FIELDS)
      .exec();
    if (!department) throw new NotFoundException(`Department ${id} not found`);
    return department;
  }

  async create(dto: CreateDepartmentDto) {
    const name = this.validateName(dto.name);
    const manager = await this.validateUserId(dto.manager ?? null);
    const viceManager = await this.validateUserId(dto.viceManager ?? null);
    this.validateDistinctManagers(manager, viceManager);
    const teamManagers = await this.validateUserIds(dto.teamManagers ?? []);
    const members = await this.validateUserIds(dto.members ?? []);

    const department = await this.departmentModel.create({
      name,
      manager,
      viceManager,
      teamManagers,
      members,
    });
    await this.syncDepartmentMemberships(department, []);
    return this.findOne(String(department._id));
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    this.validateDepartmentId(id);
    const current = await this.departmentModel.findById(id).exec();
    if (!current) throw new NotFoundException(`Department ${id} not found`);

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = this.validateName(dto.name);
    if (dto.manager !== undefined) {
      updates.manager = await this.validateUserId(dto.manager);
    }
    if (dto.viceManager !== undefined) {
      updates.viceManager = await this.validateUserId(dto.viceManager);
    }
    if (dto.teamManagers !== undefined) {
      updates.teamManagers = await this.validateUserIds(dto.teamManagers);
    }
    if (dto.members !== undefined) {
      updates.members = await this.validateUserIds(dto.members);
    }

    const manager = Object.prototype.hasOwnProperty.call(updates, 'manager')
      ? (updates.manager as Types.ObjectId | null)
      : current.manager;
    const viceManager = Object.prototype.hasOwnProperty.call(
      updates,
      'viceManager',
    )
      ? (updates.viceManager as Types.ObjectId | null)
      : current.viceManager;
    this.validateDistinctManagers(manager, viceManager);

    const updated = await this.departmentModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
    if (!updated) throw new NotFoundException(`Department ${id} not found`);
    await this.syncDepartmentMemberships(
      updated,
      this.getDepartmentUserIds(current),
    );
    return this.findOne(id);
  }

  async assignManager(id: string, userId: string | null) {
    if (userId === undefined) {
      throw new BadRequestException('userId is required; use null to unassign');
    }
    return this.update(id, { manager: userId });
  }

  async assignViceManager(id: string, userId: string | null) {
    if (userId === undefined) {
      throw new BadRequestException('userId is required; use null to unassign');
    }
    return this.update(id, { viceManager: userId });
  }

  async assignTeamManagers(id: string, userIds: string[]) {
    if (!Array.isArray(userIds)) {
      throw new BadRequestException('userIds must be an array');
    }
    return this.update(id, { teamManagers: userIds });
  }

  async assignMembers(id: string, userIds: string[]) {
    if (!Array.isArray(userIds)) {
      throw new BadRequestException('userIds must be an array');
    }
    return this.update(id, { members: userIds });
  }

  async remove(id: string) {
    this.validateDepartmentId(id);
    const department = await this.departmentModel.findById(id).exec();
    if (!department) throw new NotFoundException(`Department ${id} not found`);
    await this.departmentModel.findByIdAndDelete(id).exec();
    await this.syncDepartmentMemberships(
      department,
      this.getDepartmentUserIds(department),
      true,
    );
    return { deleted: true };
  }

  async resyncAllMemberships() {
    const departments = await this.departmentModel
      .find()
      .select('_id manager viceManager teamManagers members')
      .exec();
    const assignments = new Map<string, Map<string, string>>();

    for (const department of departments) {
      const departmentId = String(department._id);
      const departmentAssignments = new Map<string, string>();

      for (const userId of department.members ?? []) {
        departmentAssignments.set(String(userId), 'Member');
      }
      for (const userId of department.teamManagers ?? []) {
        departmentAssignments.set(String(userId), 'Team Manager');
      }
      if (department.manager) {
        departmentAssignments.set(String(department.manager), 'Responsable');
      }
      if (department.viceManager) {
        departmentAssignments.set(
          String(department.viceManager),
          'Responsable',
        );
      }

      assignments.set(departmentId, departmentAssignments);
      for (const [userId, role] of departmentAssignments) {
        await this.syncMembership(userId, departmentId, role);
      }
    }

    const users = await this.userModel.find().select('memberships').exec();
    let removedMemberships = 0;
    for (const user of users) {
      const userId = String(user._id);
      const userAssignments = user.memberships ?? [];
      const staleDepartmentIds = new Set(
        userAssignments
          .filter((membership) => {
            if (!membership.departmentId) return false;
            const departmentId = String(membership.departmentId);
            return !assignments.get(departmentId)?.has(userId);
          })
          .map((membership) => String(membership.departmentId)),
      );

      for (const departmentId of staleDepartmentIds) {
        await this.removeMembership(userId, departmentId);
        removedMemberships += 1;
      }
    }

    return {
      departments: departments.length,
      memberships: Array.from(assignments.values()).reduce(
        (total, departmentAssignments) => total + departmentAssignments.size,
        0,
      ),
      removedMemberships,
    };
  }

  // ─────────────────────────────────────────────
  //  Membership sync helpers
  // ─────────────────────────────────────────────

  private async syncMembership(
    userId: string,
    departmentId: string,
    role: string,
  ) {
    if (!Types.ObjectId.isValid(userId)) return;
    if (!Types.ObjectId.isValid(departmentId)) return;

    const user = await this.userModel.findById(userId).exec();
    if (!user) return;

    // Drop broken entries (no departmentId) so we don't keep them around
    const existing: Membership[] = user.memberships ?? [];

    // Skip if user already has this exact (dept, role) pair
    const already = existing.some(
      (m) => String(m.departmentId) === String(departmentId) && m.role === role,
    );
    if (already) {
      // Déjà membre : on s'assure juste que `departement` reste à jour
      await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            departement: existing
              .filter((m) => !!m.departmentId)
              .map((m) => m.departmentId),
          },
          { new: true },
        )
        .exec();
      return;
    }

    // Drop any prior membership for this department (role change)
    const filtered = existing.filter(
      (m) => String(m.departmentId) !== String(departmentId),
    );

    // Don't touch admins with a global membership
    // const hasGlobal = filtered.some(
    //   (m) =>
    //     !m.departmentId &&
    //     ['President', 'Director Executive'].includes(m.role),
    // );
    // if (hasGlobal) return;

    const newMembership = {
      _id: new Types.ObjectId(),
      departmentId: new Types.ObjectId(departmentId),
      role,
    };

    const memberships = [...filtered, newMembership];

    const activeValid =
      user.activeMembershipId != null &&
      memberships.some(
        (m) => String(m._id) === String(user.activeMembershipId),
      );

    const patch: Partial<User> = {
      memberships,
      departement: memberships.flatMap((m) =>
        m.departmentId ? [m.departmentId] : [],
      ),
    };
    if (!activeValid) patch.activeMembershipId = memberships[0]?._id ?? null;

    await this.userModel.findByIdAndUpdate(userId, patch, { new: true }).exec();
  }

  private async syncDepartmentMemberships(
    department: DepartmentDocument,
    previousUserIds: string[],
    removed = false,
  ) {
    const departmentId = String(department._id);
    const assignments = removed
      ? new Map<string, string>()
      : this.getDepartmentAssignments(department);
    const affectedUserIds = new Set([
      ...previousUserIds,
      ...assignments.keys(),
    ]);

    for (const userId of affectedUserIds) {
      const role = assignments.get(userId);
      if (role) {
        await this.syncMembership(userId, departmentId, role);
      } else {
        await this.removeMembership(userId, departmentId);
      }
    }
  }

  private getDepartmentAssignments(
    department: Pick<
      Department,
      'manager' | 'viceManager' | 'teamManagers' | 'members'
    >,
  ) {
    const assignments = new Map<string, string>();
    for (const userId of department.members ?? []) {
      assignments.set(this.getUserId(userId), 'Member');
    }
    for (const userId of department.teamManagers ?? []) {
      assignments.set(this.getUserId(userId), 'Team Manager');
    }
    if (department.manager) {
      assignments.set(this.getUserId(department.manager), 'Responsable');
    }
    if (department.viceManager) {
      assignments.set(this.getUserId(department.viceManager), 'Responsable');
    }
    return assignments;
  }

  private getDepartmentUserIds(
    department: Pick<
      Department,
      'manager' | 'viceManager' | 'teamManagers' | 'members'
    >,
  ) {
    return Array.from(this.getDepartmentAssignments(department).keys());
  }

  private getUserId(value: Types.ObjectId | string) {
    return typeof value === 'string' ? value : value.toHexString();
  }

  private async removeMembership(userId: string, departmentId: string) {
    if (!Types.ObjectId.isValid(userId)) return;

    const user = await this.userModel.findById(userId).exec();
    if (!user) return;

    const existing: Membership[] = user.memberships ?? [];
    const filtered = existing.filter(
      (m) => String(m.departmentId) !== String(departmentId),
    );
    if (filtered.length === existing.length) return;

    const activeValid =
      user.activeMembershipId != null &&
      filtered.some((m) => String(m._id) === String(user.activeMembershipId));

    const patch: Partial<User> = {
      memberships: filtered,
      departement: filtered.flatMap((m) =>
        m.departmentId ? [m.departmentId] : [],
      ),
    };
    if (!activeValid) {
      patch.activeMembershipId = filtered[0]?._id ?? null;
    }

    await this.userModel.findByIdAndUpdate(userId, patch, { new: true }).exec();
  }

  // ─────────────────────────────────────────────
  //  Validation
  // ─────────────────────────────────────────────

  private validateName(name: string) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new BadRequestException('Department name is required');
    }
    return name.trim();
  }

  private validateDepartmentId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid department ID');
    }
  }

  private async validateUserId(userId: string | null) {
    if (userId === null) return null;
    if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('A valid user ID is required');
    }

    const objectId = new Types.ObjectId(userId);
    const exists = await this.userModel.exists({ _id: objectId });
    if (!exists) throw new BadRequestException(`User ${userId} does not exist`);
    return objectId;
  }

  private async validateUserIds(userIds: string[]) {
    if (!Array.isArray(userIds)) {
      throw new BadRequestException('User IDs must be an array');
    }
    if (
      userIds.some(
        (userId) =>
          typeof userId !== 'string' || !Types.ObjectId.isValid(userId),
      )
    ) {
      throw new BadRequestException('All user IDs must be valid');
    }
    const normalizedUserIds = userIds.map((userId) => userId.toLowerCase());
    if (new Set(normalizedUserIds).size !== normalizedUserIds.length) {
      throw new BadRequestException('A user cannot be assigned more than once');
    }

    const objectIds = normalizedUserIds.map(
      (userId) => new Types.ObjectId(userId),
    );
    const existingCount = await this.userModel.countDocuments({
      _id: { $in: objectIds },
    });
    if (existingCount !== objectIds.length) {
      throw new BadRequestException('One or more users do not exist');
    }
    return objectIds;
  }

  private validateDistinctManagers(
    manager: Types.ObjectId | null,
    viceManager: Types.ObjectId | null,
  ) {
    if (manager && viceManager && manager.equals(viceManager)) {
      throw new BadRequestException(
        'Manager and Vice Manager must be different users',
      );
    }
  }
}
