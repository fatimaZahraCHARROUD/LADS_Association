import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
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

    const deptId = String(department._id);
    if (manager) await this.syncMembership(String(manager), deptId, 'Responsable');
    if (viceManager) await this.syncMembership(String(viceManager), deptId, 'Responsable');
    for (const tm of teamManagers) await this.syncMembership(String(tm), deptId, 'Team Manager');
    for (const m of members) await this.syncMembership(String(m), deptId, 'Member');

    return this.findOne(deptId);
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    this.validateDepartmentId(id);
    const current = await this.departmentModel.findById(id).exec();
    if (!current) throw new NotFoundException(`Department ${id} not found`);

    // Snapshot the current member lists so we can diff
    const beforeManager = current.manager ? String(current.manager) : null;
    const beforeVice = current.viceManager ? String(current.viceManager) : null;
    const beforeTeamManagers = (current.teamManagers ?? []).map(String);
    const beforeMembers = (current.members ?? []).map(String);

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

    // ── Diff and sync memberships ──
    const afterManager = updated.manager ? String(updated.manager) : null;
    const afterVice = updated.viceManager ? String(updated.viceManager) : null;
    const afterTeamManagers = (updated.teamManagers ?? []).map(String);
    const afterMembers = (updated.members ?? []).map(String);

    const deptId = id;

    // Manager
    if (beforeManager !== afterManager) {
      if (beforeManager) await this.removeMembership(beforeManager, deptId);
      if (afterManager) await this.syncMembership(afterManager, deptId, 'Responsable');
    }

    // Vice manager
    if (beforeVice !== afterVice) {
      if (beforeVice) await this.removeMembership(beforeVice, deptId);
      if (afterVice) await this.syncMembership(afterVice, deptId, 'Responsable');
    }

    // Team managers — added / removed
    const addedTM = afterTeamManagers.filter((x) => !beforeTeamManagers.includes(x));
    const removedTM = beforeTeamManagers.filter((x) => !afterTeamManagers.includes(x));
    for (const uid of addedTM) await this.syncMembership(uid, deptId, 'Team Manager');
    for (const uid of removedTM) await this.removeMembership(uid, deptId);

    // Members — added / removed
    const addedM = afterMembers.filter((x) => !beforeMembers.includes(x));
    const removedM = beforeMembers.filter((x) => !afterMembers.includes(x));
    for (const uid of addedM) await this.syncMembership(uid, deptId, 'Member');
    for (const uid of removedM) await this.removeMembership(uid, deptId);

    return this.findOne(deptId);
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
    const department = await this.departmentModel.findByIdAndDelete(id).exec();
    if (!department) throw new NotFoundException(`Department ${id} not found`);

    // Clean up memberships for all users attached to this department
    const userIds = new Set<string>();
    if (department.manager) userIds.add(String(department.manager));
    if (department.viceManager) userIds.add(String(department.viceManager));
    (department.teamManagers ?? []).forEach((u) => userIds.add(String(u)));
    (department.members ?? []).forEach((u) => userIds.add(String(u)));

    for (const uid of userIds) await this.removeMembership(uid, id);

    return { deleted: true };
  }

  // ─────────────────────────────────────────────
  //  Membership sync helpers
  // ─────────────────────────────────────────────

  /** Add or replace this user's membership for the given department. */
  private async syncMembership(
    userId: string,
    departmentId: string,
    role: string,
  ) {
    if (!Types.ObjectId.isValid(userId)) return;
    if (!Types.ObjectId.isValid(departmentId)) return;

    const user = await this.userModel.findById(userId).exec();
    if (!user) return;

    const existing = (user.memberships ?? []) as any[];

    // Skip if user already has this exact (dept, role) pair
    const already = existing.some(
      (m) =>
        String(m.departmentId) === String(departmentId) &&
        m.role === role,
    );
    if (already) return;

    // Drop any prior membership for this department (role change)
    const filtered = existing.filter(
      (m) => String(m.departmentId) !== String(departmentId),
    );

    // If user has a global membership (President/Director Exec), don't touch
    const hasGlobal = filtered.some(
      (m) =>
        !m.departmentId &&
        ['President', 'Director Executive'].includes(m.role),
    );
    if (hasGlobal) return;

    const newMembership = {
      _id: new Types.ObjectId(),
      departmentId: new Types.ObjectId(departmentId),
      role,
    };

    const memberships = [...filtered, newMembership];

    // Fix activeMembershipId if it just became invalid
    const activeValid =
      user.activeMembershipId &&
      memberships.some(
        (m) => String(m._id) === String(user.activeMembershipId),
      );

    const patch: any = { memberships };
    if (!activeValid) patch.activeMembershipId = memberships[0]._id;

    await this.userModel.findByIdAndUpdate(userId, patch, { new: true }).exec();
  }

  /** Remove this user's membership for the given department (if any). */
  private async removeMembership(userId: string, departmentId: string) {
    if (!Types.ObjectId.isValid(userId)) return;

    const user = await this.userModel.findById(userId).exec();
    if (!user) return;

    const existing = (user.memberships ?? []) as any[];
    const filtered = existing.filter(
      (m) => String(m.departmentId) !== String(departmentId),
    );
    if (filtered.length === existing.length) return; // nothing to remove

    const activeValid =
      user.activeMembershipId &&
      filtered.some(
        (m) => String(m._id) === String(user.activeMembershipId),
      );

    const patch: any = { memberships: filtered };
    if (!activeValid) {
      patch.activeMembershipId = filtered[0]?._id ?? null;
    }

    await this.userModel.findByIdAndUpdate(userId, patch, { new: true }).exec();
  }

  // ─────────────────────────────────────────────
  //  Validation (unchanged)
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