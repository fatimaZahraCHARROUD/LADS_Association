import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, In } from 'typeorm';
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
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    const departments = await this.departmentRepo.find({ order: { name: 'ASC' } });
    if (!departments.length) return departments;

    // Collect all user IDs referenced across departments
    const allIds = new Set<number>();
    for (const d of departments) {
      if (d.manager) allIds.add(d.manager);
      if (d.viceManager) allIds.add(d.viceManager);
      for (const id of d.teamManagers ?? []) allIds.add(id);
      for (const id of d.members ?? []) allIds.add(id);
    }

    if (!allIds.size) return departments;

    const users = await this.userRepo.find({ where: { id: In([...allIds]) } });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const pick = (id: number | null) => {
      if (!id) return null;
      const u = userMap.get(id);
      if (!u) return null;
      return { id: u.id, _id: String(u.id), fullName: u.fullName, email: u.email };
    };

    return departments.map((d) => ({
      ...d,
      manager: pick(d.manager),
      viceManager: pick(d.viceManager),
      teamManagers: (d.teamManagers ?? []).map(pick).filter(Boolean),
      members: (d.members ?? []).map(pick).filter(Boolean),
    }));
  }

  async findOne(id: string) {
    const department = await this.departmentRepo.findOne({ where: { id: Number(id) } });
    if (!department) throw new NotFoundException(`Department ${id} not found`);
    return department;
  }

  async create(dto: CreateDepartmentDto) {
    // Validate outside the transaction for clear user-facing errors
    const name = this.validateName(dto.name);
    const manager = await this.validateUserId(dto.manager ?? null);
    const viceManager = await this.validateUserId(dto.viceManager ?? null);
    this.validateDistinctManagers(manager, viceManager);
    const teamManagers = await this.validateUserIds(dto.teamManagers ?? []);
    const members = await this.validateUserIds(dto.members ?? []);

    const savedId = await this.dataSource.transaction(async (tx) => {
      const department = tx.create(Department, { name, manager, viceManager, teamManagers, members } as Partial<Department>);
      const saved = await tx.save(department);
      await this.syncDepartmentMemberships(saved, [], false, tx);
      return saved.id;
    });
    return this.findOne(String(savedId));
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

    const updatedId = await this.dataSource.transaction(async (tx) => {
      const deptInTx = await tx.findOne(Department, { where: { id: Number(id) } });
      if (!deptInTx) throw new NotFoundException(`Department ${id} not found`);
      Object.assign(deptInTx, updates);
      const updated = await tx.save(deptInTx);
      await this.syncDepartmentMemberships(updated, previousUserIds, false, tx);
      return updated.id;
    });
    return this.findOne(String(updatedId));
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
    await this.dataSource.transaction(async (tx) => {
      await tx.remove(department);
      await this.syncDepartmentMemberships(department, previousUserIds, true, tx);
    });
    return { deleted: true };
  }

  async resyncAllMemberships() {
    const departments = await this.departmentRepo.find();
    for (const department of departments) {
      await this.syncDepartmentMemberships(department, []);
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
    em?: EntityManager,
  ) {
    const deptId = department.id;
    const assignments = removed
      ? new Map<number, string>()
      : this.getDepartmentAssignments(department);
    const affectedUserIds = new Set([...previousUserIds, ...assignments.keys()]);

    for (const userId of affectedUserIds) {
      const role = assignments.get(userId);
      if (role) {
        await this.syncMembership(userId, deptId, role, em);
      } else {
        await this.removeMembership(userId, deptId, em);
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

  private async syncMembership(userId: number, departmentId: number, role: string, em?: EntityManager) {
    const manager = em ?? this.userRepo.manager;
    const user = await manager.findOne(User, {
      where: { id: userId },
      relations: ['memberships'],
    });
    if (!user) return;

    const memberships: Membership[] = user.memberships ?? [];
    const existing = memberships.find((m) => m.departmentId === departmentId);

    if (existing) {
      existing.role = role;
      await manager.save(existing);
    } else {
      // Use QueryBuilder insert to bypass TypeORM's ORM relation tracking.
      // manager.create/save resolves user_id via the @ManyToOne relation (which is
      // unset here), causing user_id = NULL → FK constraint failure.
      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(Membership)
        .values({ userId, departmentId, role })
        .execute();
      const newMembershipId: number | undefined = result.raw?.insertId;
      if (!user.activeMembershipId && newMembershipId) {
        user.activeMembershipId = newMembershipId;
        await manager.save(user);
      }
    }

    const allMemberships = await manager.find(Membership, { where: { userId } });
    user.departement = allMemberships.map((m) => m.departmentId!).filter(Boolean);
    await manager.save(user);
  }

  private async removeMembership(userId: number, departmentId: number, em?: EntityManager) {
    const manager = em ?? this.userRepo.manager;
    const membership = await manager.findOne(Membership, {
      where: { userId, departmentId },
    });
    if (!membership) return;

    await manager.remove(membership);

    const user = await manager.findOne(User, { where: { id: userId } });
    if (!user) return;

    const remaining = await manager.find(Membership, { where: { userId } });
    user.departement = remaining.map((m) => m.departmentId!).filter(Boolean);
    if (user.activeMembershipId === membership.id) {
      user.activeMembershipId = remaining[0]?.id ?? null;
    }
    await manager.save(user);
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
