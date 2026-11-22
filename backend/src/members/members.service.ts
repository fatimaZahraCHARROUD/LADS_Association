import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Membership } from '../users/entities/membership.entity';
import { Department } from '../departments/entities/department.entity';
import { Cellule } from '../cellules/entities/cellule.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

export interface MemberFilter {
  nom?: string;
  ville?: string;
  status?: string;
  departement?: string;
}

const GLOBAL_ROLES = ['President', 'Director Executive'];

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Membership) private membershipRepo: Repository<Membership>,
    @InjectRepository(Department) private departmentRepo: Repository<Department>,
    @InjectRepository(Cellule) private celluleRepo: Repository<Cellule>,
  ) {}

  async create(dto: CreateMemberDto, file?: Express.Multer.File) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already exists');

    const profileImage = file ? `/uploads/members/${file.filename}` : '';
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const membershipNumber = await this.generateMembershipNumber();

    const requestedRole = (dto.role || 'Member').trim();
    const isGlobal = GLOBAL_ROLES.includes(requestedRole);
    const deptId = await this.resolveDepartmentId(dto.departement);

    const { role: _r, ...rest } = dto as any;
    const member = this.userRepo.create({
      ...rest,
      password: hashedPassword,
      profileImage,
      membershipNumber,
      date_adhesion: dto.date_adhesion ?? new Date().toISOString().slice(0, 10),
      role: [requestedRole],
      departement: deptId ? [deptId] : [],
      isAdmin: requestedRole === 'President',
    } as Partial<User>);

    const saved = await this.userRepo.save(member);

    const membershipsToCreate: Partial<Membership>[] = [];
    if (isGlobal) {
      membershipsToCreate.push({ userId: saved.id, departmentId: null, role: requestedRole });
    }
    if (deptId) {
      membershipsToCreate.push({ userId: saved.id, departmentId: deptId, role: 'Member' });
    }
    if (membershipsToCreate.length === 0) {
      membershipsToCreate.push({ userId: saved.id, departmentId: null, role: 'Member' });
    }

    const createdMemberships = await this.membershipRepo.save(
      membershipsToCreate.map((m) => this.membershipRepo.create(m)),
    );

    const activeMembership = createdMemberships.find((m) => !m.departmentId) ?? createdMemberships[0];
    await this.userRepo.update(saved.id, { activeMembershipId: activeMembership.id });

    const result = await this.userRepo.findOne({ where: { id: saved.id }, relations: ['memberships'] });
    const { password: _pw, ...safeResult } = result as any;
    return safeResult;
  }

  private async generateMembershipNumber(): Promise<string> {
    const count = await this.userRepo.count();
    let number = count + 1;
    let candidate = `MEM-${String(number).padStart(4, '0')}`;
    while (await this.userRepo.findOne({ where: { membershipNumber: candidate } })) {
      number += 1;
      candidate = `MEM-${String(number).padStart(4, '0')}`;
    }
    return candidate;
  }

  async findAll(filter: MemberFilter = {}, userId?: string) {
    const numUserId = userId ? Number(userId) : null;
    const role = numUserId ? await this.getActiveRole(userId!) : null;
    const isGlobalUser = !role || GLOBAL_ROLES.includes(role);

    let allowedUserIds: number[] | null = null;

    if (!isGlobalUser && numUserId) {
      if (role === 'Team Manager') {
        const deptIds = await this.getTeamManagerDepartmentIds(numUserId);
        if (deptIds.length === 0) return [];
        const members = await this.userRepo.find({ where: { isAdmin: false } });
        const filtered = members.filter((u) => u.departement?.some((dId) => deptIds.includes(dId)));
        if (filter.departement) {
          const deptId = await this.resolveDepartmentId(filter.departement);
          if (!deptId || !deptIds.includes(deptId)) return [];
          allowedUserIds = filtered.filter((u) => u.departement?.includes(deptId)).map((u) => u.id);
        } else {
          allowedUserIds = filtered.map((u) => u.id);
        }
      } else if (role === 'Responsable') {
        const scope = await this.getResponsableScopedMembers(numUserId, filter.departement);
        if (scope.ids.length === 0) return [];
        allowedUserIds = scope.ids;
      } else {
        allowedUserIds = [numUserId];
      }
    }

    const where: any = { isAdmin: false };
    if (allowedUserIds !== null) {
      if (allowedUserIds.length === 0) return [];
      where.id = In(allowedUserIds);
    }
    if (filter.nom) where.fullName = ILike(`%${filter.nom}%`);
    if (filter.ville) where.ville = ILike(`%${filter.ville}%`);
    if (filter.status) where.status = filter.status;
    if (filter.departement && !allowedUserIds) {
      const deptId = await this.resolveDepartmentId(filter.departement);
      if (!deptId) return [];
      const deptMembers = await this.userRepo.find({ where: { isAdmin: false } });
      const ids = deptMembers.filter((u) => u.departement?.includes(deptId)).map((u) => u.id);
      if (ids.length === 0) return [];
      where.id = In(ids);
    }

    const rows = await this.userRepo.find({ where, relations: ['memberships'], order: { createdAt: 'DESC' } });
    return rows.map(({ password: _pw, ...rest }: any) => rest);
  }

  async findOne(id: string) {
    const member = await this.userRepo.findOne({ where: { id: Number(id) }, relations: ['memberships'] });
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    const { password: _pw, ...rest } = member as any;
    return rest;
  }

  async update(id: string, dto: UpdateMemberDto, file?: Express.Multer.File) {
    const memberDoc = await this.userRepo.findOne({ where: { id: Number(id) }, relations: ['memberships'] });
    if (!memberDoc) throw new NotFoundException(`Member ${id} not found`);

    const { role: newRole, departement: newDept, ...rest } = dto as any;
    const data: any = { ...rest };

    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    if (file) data.profileImage = `/uploads/members/${file.filename}`;

    const existingMemberships = memberDoc.memberships ?? [];
    const currentGlobal = existingMemberships.find((m: any) => !m.departmentId && GLOBAL_ROLES.includes(m.role));

    let targetGlobalRole: string | null = currentGlobal?.role ?? null;
    if (newRole !== undefined) {
      const roleTrimmed = String(newRole).trim();
      if (GLOBAL_ROLES.includes(roleTrimmed)) {
        targetGlobalRole = roleTrimmed;
      } else if (!currentGlobal) {
        targetGlobalRole = null;
      }
    }

    let memberships = existingMemberships.filter((m: any) => !!m.departmentId);

    if (newDept !== undefined) {
      const deptId = await this.resolveDepartmentId(newDept);
      if (deptId) {
        const currentDept = existingMemberships.find((m: any) => !!m.departmentId);
        const preservedRole =
          currentDept && ['Team Manager', 'Responsable'].includes(currentDept.role)
            ? currentDept.role
            : 'Member';
        memberships = memberships.filter((m: any) => m.departmentId !== deptId);
        const newMs = this.membershipRepo.create({ userId: Number(id), departmentId: deptId, role: preservedRole });
        memberships.push(await this.membershipRepo.save(newMs) as any);
      }
    }

    if (targetGlobalRole) {
      if (currentGlobal) {
        await this.membershipRepo.update(currentGlobal.id, { role: targetGlobalRole });
        const updated = { ...currentGlobal, role: targetGlobalRole };
        memberships.push(updated as any);
      } else {
        const newMs = this.membershipRepo.create({ userId: Number(id), departmentId: null, role: targetGlobalRole });
        memberships.push(await this.membershipRepo.save(newMs) as any);
      }
    }

    if (memberships.length === 0) {
      const newMs = this.membershipRepo.create({ userId: Number(id), departmentId: null, role: 'Member' });
      memberships.push(await this.membershipRepo.save(newMs) as any);
    }

    const activeStillValid = memberships.some((m: any) => m.id === memberDoc.activeMembershipId);
    if (!activeStillValid) {
      const globalMs = memberships.find((m: any) => !m.departmentId);
      data.activeMembershipId = globalMs?.id ?? (memberships[0] as any).id;
    }

    data.role = [...new Set(memberships.map((m: any) => m.role).filter(Boolean))];
    data.departement = memberships.filter((m: any) => !!m.departmentId).map((m: any) => m.departmentId);
    data.isAdmin = memberships.some((m: any) => !m.departmentId && m.role === 'President');

    await this.userRepo.update(Number(id), data);
    const result = await this.userRepo.findOne({ where: { id: Number(id) }, relations: ['memberships'] });
    if (!result) throw new NotFoundException(`Member ${id} not found`);
    const { password: _pw, ...safeResult } = result as any;
    return safeResult;
  }

  async remove(id: string) {
    const member = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    await this.userRepo.remove(member);
    return { deleted: true };
  }

  async getMyDepartments(userId: string) {
    const role = await this.getActiveRole(userId);
    if (role === 'Team Manager') {
      const ids = await this.getTeamManagerDepartmentIds(Number(userId));
      return ids.length ? this.departmentRepo.find({ where: { id: In(ids) } }) : [];
    }
    return this.departmentRepo.find({ select: { id: true, name: true } as any });
  }

  private async getActiveRole(userId: string): Promise<string | null> {
    const user = await this.userRepo.findOne({ where: { id: Number(userId) }, relations: ['memberships'] });
    if (!user) return null;
    if (user.isAdmin === true || (user.role ?? []).includes('President')) return 'President';
    const active = (user.memberships ?? []).find((m: any) => m.id === user.activeMembershipId);
    return active?.role ?? null;
  }

  private async resolveDepartmentId(names?: string[] | string): Promise<number | null> {
    const name = Array.isArray(names) ? names[0] : (names ?? null);
    if (!name) return null;
    const numId = Number(name);
    if (!isNaN(numId)) {
      const exists = await this.departmentRepo.findOne({ where: { id: numId } });
      return exists ? numId : null;
    }
    const dept = await this.departmentRepo.findOne({ where: { name } as any });
    return dept ? dept.id : null;
  }

  private async getTeamManagerDepartmentIds(userId: number): Promise<number[]> {
    const depts = await this.departmentRepo
      .createQueryBuilder('d')
      .where('d.manager = :uid OR d.vice_manager = :uid OR JSON_CONTAINS(d.team_managers, :juid)', { uid: userId, juid: JSON.stringify(userId) })
      .getMany();
    return depts.map((d) => d.id);
  }

  private async getResponsableScopedMembers(
    userId: number,
    filterDeptName?: string,
  ): Promise<{ ids: number[]; roles: Map<number, string> }> {
    const me = await this.userRepo.findOne({ where: { id: userId }, relations: ['memberships'] });
    const activeMembership = (me?.memberships ?? []).find((m: any) => m.id === me?.activeMembershipId);
    if (!activeMembership?.departmentId) return { ids: [], roles: new Map() };

    const deptQuery: any = { id: activeMembership.departmentId };
    if (filterDeptName) deptQuery.name = filterDeptName;
    const department = await this.departmentRepo.findOne({ where: deptQuery });
    if (!department) return { ids: [], roles: new Map() };

    const roles = new Map<number, string>();
    const setIfAbsent = (uid: any, label: string) => { const key = Number(uid); if (!roles.has(key)) roles.set(key, label); };

    if (department.manager) setIfAbsent(department.manager, 'Manager');
    if (department.viceManager) setIfAbsent(department.viceManager, 'Vice Manager');
    (department.teamManagers ?? []).forEach((u) => setIfAbsent(u, 'Team Manager'));
    (department.members ?? []).forEach((u) => setIfAbsent(u, 'Member'));
    roles.delete(userId);

    return { ids: [...roles.keys()], roles };
  }
}
