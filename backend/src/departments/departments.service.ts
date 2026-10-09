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
    if (manager)
      await this.syncMembership(String(manager), deptId, 'Responsable');
    if (viceManager)
      await this.syncMembership(String(viceManager), deptId, 'Responsable');
    for (const tm of teamManagers)
      await this.syncMembership(String(tm), deptId, 'Team Manager');
    for (const m of members)
      await this.syncMembership(String(m), deptId, 'Member');

    return this.findOne(deptId);
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    this.validateDepartmentId(id);
    const current = await this.departmentModel.findById(id).exec();
    if (!current) throw new NotFoundException(`Department ${id} not found`);

    // ── Snapshot BEFORE state ──
    const beforeManager = current.manager ? String(current.manager) : null;
    const beforeVice = current.viceManager ? String(current.viceManager) : null;
    const beforeTeamManagers = (current.teamManagers ?? []).map(String);
    const beforeMembers = (current.members ?? []).map(String);

    // ── Build updates object ──
    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = this.validateName(dto.name);
    if (dto.manager !== undefined)
      updates.manager = await this.validateUserId(dto.manager);
    if (dto.viceManager !== undefined)
      updates.viceManager = await this.validateUserId(dto.viceManager);
    if (dto.teamManagers !== undefined)
      updates.teamManagers = await this.validateUserIds(dto.teamManagers);
    if (dto.members !== undefined)
      updates.members = await this.validateUserIds(dto.members);

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

    // ── Apply the department update ──
    const updated = await this.departmentModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
    if (!updated) throw new NotFoundException(`Department ${id} not found`);

    // ── Snapshot AFTER state (must come after the DB update) ──
    const afterManager = updated.manager ? String(updated.manager) : null;
    const afterVice = updated.viceManager ? String(updated.viceManager) : null;
    const afterTeamManagers = (updated.teamManagers ?? []).map(String);
    const afterMembers = (updated.members ?? []).map(String);

    const deptId = id;

    // ── Sync memberships: Manager ──
    if (dto.manager !== undefined) {
      if (beforeManager && beforeManager !== afterManager) {
        await this.removeMembership(beforeManager, deptId);
      }
      if (afterManager) {
        await this.syncMembership(afterManager, deptId, 'Responsable');
      }
    }

    // ── Sync memberships: Vice manager ──
    if (dto.viceManager !== undefined) {
      if (beforeVice && beforeVice !== afterVice) {
        await this.removeMembership(beforeVice, deptId);
      }
      if (afterVice) {
        await this.syncMembership(afterVice, deptId, 'Responsable');
      }
    }

    // ── Sync memberships: Team managers (full resync) ──
    if (dto.teamManagers !== undefined) {
      for (const uid of afterTeamManagers) {
        await this.syncMembership(uid, deptId, 'Team Manager');
      }
      for (const uid of beforeTeamManagers) {
        if (!afterTeamManagers.includes(uid)) {
          await this.removeMembership(uid, deptId);
        }
      }
    }

    // ── Sync memberships: Members (full resync) ──
    if (dto.members !== undefined) {
      for (const uid of afterMembers) {
        await this.syncMembership(uid, deptId, 'Member');
      }
      for (const uid of beforeMembers) {
        if (!afterMembers.includes(uid)) {
          await this.removeMembership(uid, deptId);
        }
      }
    }

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
   const existing = (user.memberships ?? []) as any[];

    // Skip if user already has this exact (dept, role) pair
    const already = existing.some(
      (m) =>
        String(m.departmentId) === String(departmentId) && m.role === role,
    );
    if (already) return;

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
      user.activeMembershipId &&
      memberships.some(
        (m) => String(m._id) === String(user.activeMembershipId),
      );

    const patch: any = { memberships };
    if (!activeValid) patch.activeMembershipId = memberships[0]._id;

    await this.userModel.findByIdAndUpdate(userId, patch, { new: true }).exec();
  }

  private async removeMembership(userId: string, departmentId: string) {
    if (!Types.ObjectId.isValid(userId)) return;

    const user = await this.userModel.findById(userId).exec();
    if (!user) return;

    const existing = (user.memberships ?? []) as any[];
    const filtered = existing.filter(
      (m) => String(m.departmentId) !== String(departmentId),
    );
    if (filtered.length === existing.length) return;

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
    if (!Array.isArray(userIds))
      throw new BadRequestException('User IDs must be an array');
    const ids = userIds.map((id) =>
      typeof id === 'string' ? id.trim() : id,
    );
    if (ids.some((id) => typeof id !== 'string' || !Types.ObjectId.isValid(id)))
      throw new BadRequestException('All user IDs must be valid');
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException('A user cannot be assigned more than once');

    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const existingCount = await this.userModel.countDocuments({
      _id: { $in: objectIds },
    });
    if (existingCount !== objectIds.length)
      throw new BadRequestException('One or more users do not exist');
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

  // ─────────────────────────────────────────────
  //  One-off resync (temporary, safe to remove later)
  // ─────────────────────────────────────────────
 async resyncAllMemberships() {
  const departments = await this.departmentModel.find().exec();
  const users = await this.userModel.find({ isAdmin: { $ne: true } }).exec();

  for (const user of users) {
    const userId = String(user._id);
    const existing: any[] = (user.memberships ?? []).map((m: any) =>
      typeof m.toObject === 'function' ? m.toObject() : m,
    );

    // Preserve GLOBAL memberships
    const memberships: any[] = existing.filter((m) => !m.departmentId);

    // Rebuild department memberships from the departments collection
    for (const dept of departments) {
      const deptId = String(dept._id);
      if (dept.manager && String(dept.manager) === userId) {
        memberships.push({
          _id: new Types.ObjectId(),
          departmentId: dept._id,
          role: 'Responsable',
        });
      } else if (dept.viceManager && String(dept.viceManager) === userId) {
        memberships.push({
          _id: new Types.ObjectId(),
          departmentId: dept._id,
          role: 'Responsable',
        });
      } else if ((dept.teamManagers ?? []).some((u) => String(u) === userId)) {
        memberships.push({
          _id: new Types.ObjectId(),
          departmentId: dept._id,
          role: 'Team Manager',
        });
      } else if ((dept.members ?? []).some((u) => String(u) === userId)) {
        memberships.push({
          _id: new Types.ObjectId(),
          departmentId: dept._id,
          role: 'Member',
        });
      }
    }

    if (memberships.length === 0) {
      memberships.push({
        _id: new Types.ObjectId(),
        departmentId: null,
        role: 'Member',
      });
    }

    const activeStillValid = memberships.some(
      (m) => String(m._id) === String(user.activeMembershipId),
    );
    const activeMembershipId = activeStillValid
      ? user.activeMembershipId
      : (memberships.find((m) => !m.departmentId)?._id ?? memberships[0]._id);

    await this.userModel.findByIdAndUpdate(userId, {
      $set: {
        memberships,
        activeMembershipId,
        role: Array.from(
          new Set(memberships.map((m) => m.role).filter(Boolean)),
        ),
        departement: memberships
          .filter((m) => !!m.departmentId)
          .map((m) => m.departmentId),
      },
    });
  }

  return { ok: true, departments: departments.length, users: users.length };
}


  
}