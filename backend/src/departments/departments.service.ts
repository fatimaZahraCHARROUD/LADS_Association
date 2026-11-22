import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Department } from './entities/department.entity';
import { User } from '../users/entities/user.entity';
import { Membership } from '../users/entities/membership.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findAll() {
    return this.departmentRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const department = await this.departmentRepo.findOne({ where: { id: Number(id) } });
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

    const department = this.departmentRepo.create({
      name,
      manager,
      viceManager,
      teamManagers,
      members,
    } as Partial<Department>);
    const saved = await this.departmentRepo.save(department);
    await this.syncDepartmentMemberships(saved, []);
    return this.findOne(String(saved.id));
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const current = await this.departmentRepo.findOne({ where: { id: Number(id) } });
    if (!current) throw new NotFoundException(`Department ${id} not found`);

    const previousUserIds = this.getDepartmentUserIds(current);
    const updates: Partial<Department> = {};
    if (dto.name !== undefined) updates.name = this.validateName(dto.name);
    if (dto.manager !== undefined) updates.manager = await this.validateUserId(dto.manager);
    if (dto.viceManager !== undefined) updates.viceManager = await this.validateUserId(dto.viceManager);
    if (dto.teamManagers !== undefined) updates.teamManagers = await this.validateUserIds(dto.teamManagers);
    if (dto.members !== undefined) updates.members = await this.validateUserIds(dto.members);

    const finalManager = updates.manager !== undefined ? updates.manager : current.manager;
    const finalViceManager = updates.viceManager !== undefined ? updates.viceManager : current.viceManager;
    this.validateDistinctManagers(finalManager, finalViceManager);

    Object.assign(current, updates);
    const updated = await this.departmentRepo.save(current);
    await this.syncDepartmentMemberships(updated, previousUserIds);
    return this.findOne(id);
  }

  async assignManager(id: string, userId: string | null) {
    return this.update(id, { manager: userId });
  }

  async assignViceManager(id: string, userId: string | null) {
    return this.update(id, { viceManager: userId });
  }

  async assignTeamManagers(id: string, userIds: string[]) {
    if (!Array.isArray(userIds)) throw new BadRequestException('userIds must be an array');
    return this.update(id, { teamManagers: userIds });
  }

  async assignMembers(id: string, userIds: string[]) {
    if (!Array.isArray(userIds)) throw new BadRequestException('userIds must be an array');
    return this.update(id, { members: userIds });
  }

  async remove(id: string) {
    const department = await this.departmentRepo.findOne({ where: { id: Number(id) } });
    if (!department) throw new NotFoundException(`Department ${id} not found`);
    const previousUserIds = this.getDepartmentUserIds(department);
    await this.departmentRepo.remove(department);
    await this.syncDepartmentMemberships(department, previousUserIds, true);
    return { deleted: true };
  }

  async resyncAllMemberships() {
    const departments = await this.departmentRepo.find();
    const assignments = new Map<number, Map<number, string>>();

    for (const department of departments) {
      const deptId = department.id;
      const deptAssignments = new Map<number, string>();
      for (const uid of department.members ?? []) deptAssignments.set(uid, 'Member');
      for (const uid of department.teamManagers ?? []) deptAssignments.set(uid, 'Team Manager');
      if (department.manager) deptAssignments.set(department.manager, 'Responsable');
      if (department.viceManager) deptAssignments.set(department.viceManager, 'Responsable');
      assignments.set(deptId, deptAssignments);
    }

    return { departments: departments.length, synced: true };
  }

  // ─────────────────────────────────────────────
  //  Membership sync helpers
  // ─────────────────────────────────────────────

  private async syncDepartmentMemberships(
    department: Department,
    previousUserIds: number[],
    removed = false,
  ) {
    const deptId = department.id;
    const assignments = removed
      ? new Map<number, string>()
      : this.getDepartmentAssignments(department);
    const affectedUserIds = new Set([...previousUserIds, ...assignments.keys()]);

    for (const userId of affectedUserIds) {
      const role = assignments.get(userId);
      if (role) {
        await this.syncMembership(userId, deptId, role);
      } else {
        await this.removeMembership(userId, deptId);
      }
    }
  }

  private getDepartmentAssignments(department: Department): Map<number, string> {
    const assignments = new Map<number, string>();
    for (const uid of department.members ?? []) assignments.set(uid, 'Member');
    for (const uid of department.teamManagers ?? []) assignments.set(uid, 'Team Manager');
    if (department.manager) assignments.set(department.manager, 'Responsable');
    if (department.viceManager) assignments.set(department.viceManager, 'Responsable');
    return assignments;
  }

  private getDepartmentUserIds(department: Department): number[] {
    return Array.from(this.getDepartmentAssignments(department).keys());
  }

  private async syncMembership(userId: number, departmentId: number, role: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['memberships'],
    });
    if (!user) return;

    const memberships: Membership[] = user.memberships ?? [];
    const existing = memberships.find((m) => m.departmentId === departmentId);

    if (existing) {
      existing.role = role;
      await this.userRepo.manager.save(existing);
    } else {
      const newMembership = this.userRepo.manager.create(Membership, {
        userId,
        departmentId,
        role,
      });
      await this.userRepo.manager.save(newMembership);
      if (!user.activeMembershipId) {
        user.activeMembershipId = newMembership.id;
        await this.userRepo.save(user);
      }
    }

    const allMemberships = await this.userRepo.manager.find(Membership, { where: { userId } });
    user.departement = allMemberships.map((m) => m.departmentId!).filter(Boolean);
    await this.userRepo.save(user);
  }

  private async removeMembership(userId: number, departmentId: number) {
    const membership = await this.userRepo.manager.findOne(Membership, {
      where: { userId, departmentId },
    });
    if (!membership) return;

    await this.userRepo.manager.remove(membership);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const remaining = await this.userRepo.manager.find(Membership, { where: { userId } });
    user.departement = remaining.map((m) => m.departmentId!).filter(Boolean);
    if (user.activeMembershipId === membership.id) {
      user.activeMembershipId = remaining[0]?.id ?? null;
    }
    await this.userRepo.save(user);
  }

  // ─────────────────────────────────────────────
  //  Validation
  // ─────────────────────────────────────────────

  private validateName(name: string): string {
    if (typeof name !== 'string' || !name.trim()) {
      throw new BadRequestException('Department name is required');
    }
    return name.trim();
  }

  private async validateUserId(userId: string | null): Promise<number | null> {
    if (userId === null) return null;
    const numId = Number(userId);
    if (isNaN(numId)) throw new BadRequestException('A valid user ID is required');
    const exists = await this.userRepo.findOne({ where: { id: numId } });
    if (!exists) throw new BadRequestException(`User ${userId} does not exist`);
    return numId;
  }

  private async validateUserIds(userIds: string[]): Promise<number[]> {
    if (!Array.isArray(userIds)) throw new BadRequestException('User IDs must be an array');
    const numIds = userIds.map((id) => Number(id));
    if (numIds.some((id) => isNaN(id))) throw new BadRequestException('All user IDs must be valid');
    if (new Set(numIds).size !== numIds.length) throw new BadRequestException('A user cannot be assigned more than once');
    if (numIds.length === 0) return [];
    const found = await this.userRepo.find({ where: { id: In(numIds) } });
    if (found.length !== numIds.length) throw new BadRequestException('One or more users do not exist');
    return numIds;
  }

  private validateDistinctManagers(manager: number | null, viceManager: number | null) {
    if (manager && viceManager && manager === viceManager) {
      throw new BadRequestException('Manager and Vice Manager must be different users');
    }
  }
}
