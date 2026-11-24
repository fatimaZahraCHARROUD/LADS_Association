import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cellule } from './entities/cellule.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { CreateCelluleDto } from './dto/create-cellule.dto';
import { UpdateCelluleDto } from './dto/update-cellule.dto';

const GLOBAL_ROLES = ['President', 'Director Executive'];

@Injectable()
export class CellulesService {
  constructor(
    @InjectRepository(Cellule) private readonly celluleRepo: Repository<Cellule>,
    @InjectRepository(Department) private readonly departmentRepo: Repository<Department>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private async getScope(userId?: string) {
    if (!userId) return { role: null, departmentId: null, isGlobal: false };
    const numId = Number(userId);
    if (isNaN(numId)) return { role: null, departmentId: null, isGlobal: false };

    const user = await this.userRepo.findOne({
      where: { id: numId },
      relations: ['memberships'],
    });
    if (!user) return { role: null, departmentId: null, isGlobal: false };

    if (user.isAdmin === true || (user.role ?? []).includes('President')) {
      return { role: 'President', departmentId: null, isGlobal: true };
    }

    const activeMembership = (user.memberships ?? []).find(
      (m: any) => m.id === user.activeMembershipId,
    );
    const role = activeMembership?.role ?? null;
    const isGlobal = GLOBAL_ROLES.includes(role ?? '');
    const departmentId = activeMembership?.departmentId ?? null;

    return { role, departmentId, isGlobal };
  }

  private async getAllowedDepartmentMembers(departmentId: number): Promise<{ allowed: Set<number>; exists: boolean }> {
    const dept = await this.departmentRepo.findOne({ where: { id: departmentId } });
    if (!dept) return { allowed: new Set(), exists: false };

    const allowed = new Set<number>();
    if (dept.manager) allowed.add(dept.manager);
    if (dept.viceManager) allowed.add(dept.viceManager);
    (dept.teamManagers ?? []).forEach((u) => allowed.add(u));
    (dept.members ?? []).forEach((u) => allowed.add(u));
    return { allowed, exists: true };
  }

  async findAll(userId?: string, _departmentId?: string) {
    const scope = await this.getScope(userId);
    const where: Record<string, unknown> = {};

    if (scope.isGlobal) {
      if (_departmentId) where['departmentId'] = Number(_departmentId);
    } else {
      if (!scope.departmentId) return [];
      where['departmentId'] = scope.departmentId;
    }

    return this.celluleRepo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string, userId?: string) {
    const cellule = await this.celluleRepo.findOne({ where: { id: Number(id) } });
    if (!cellule) throw new NotFoundException(`Cellule ${id} not found`);
    await this.assertCanAccessCellule(cellule, userId);
    return cellule;
  }

  async create(dto: CreateCelluleDto, userId?: string) {
    if (!dto.name?.trim()) throw new BadRequestException('Cellule name is required');
    if (!userId) throw new ForbiddenException('Missing user');

    const scope = await this.getScope(userId);
    let departmentId: number;

    if (scope.isGlobal) {
      if (!dto.departmentId) throw new BadRequestException('departmentId is required');
      await this.validateDepartment(Number(dto.departmentId));
      departmentId = Number(dto.departmentId);
    } else {
      if (!scope.departmentId) throw new ForbiddenException('You have no active department membership.');
      departmentId = scope.departmentId;
    }

    const managerId = dto.managerId ? Number(dto.managerId) : Number(userId);
    const { allowed } = await this.getAllowedDepartmentMembers(departmentId);
    allowed.add(Number(userId));
    if (!allowed.has(managerId)) throw new ForbiddenException('The chosen manager is not part of this department.');

    const members = await this.validateMembersInDepartment(dto.members ?? [], allowed);

    const cellule = this.celluleRepo.create({
      name: dto.name.trim(),
      description: dto.description ?? '',
      departmentId,
      managerId,
      members,
      status: dto.status ?? 'active',
    } as Partial<Cellule>);
    return this.celluleRepo.save(cellule);
  }

  async update(id: string, dto: UpdateCelluleDto, userId?: string) {
    const existing = await this.celluleRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Cellule ${id} not found`);
    await this.assertCanAccessCellule(existing, userId);
    const scope = await this.getScope(userId);

    if (dto.name !== undefined) {
      if (!dto.name.trim()) throw new BadRequestException('Cellule name is required');
      existing.name = dto.name.trim();
    }
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.status !== undefined) existing.status = dto.status;

    if (scope.isGlobal && dto.departmentId !== undefined) {
      await this.validateDepartment(Number(dto.departmentId));
      existing.departmentId = Number(dto.departmentId);
    }

    const targetDept = existing.departmentId;

    if (dto.managerId !== undefined) {
      const managerId = Number(dto.managerId);
      if (!scope.isGlobal) {
        const { allowed } = await this.getAllowedDepartmentMembers(targetDept);
        if (userId) allowed.add(Number(userId));
        if (!allowed.has(managerId)) throw new ForbiddenException('The chosen manager is not part of this department.');
      }
      existing.managerId = managerId;
    }

    if (dto.members !== undefined) {
      const { allowed } = await this.getAllowedDepartmentMembers(targetDept);
      if (userId) allowed.add(Number(userId));
      existing.members = await this.validateMembersInDepartment(dto.members, allowed);
    }

    return this.celluleRepo.save(existing);
  }

  async remove(id: string, userId?: string) {
    const cellule = await this.celluleRepo.findOne({ where: { id: Number(id) } });
    if (!cellule) throw new NotFoundException(`Cellule ${id} not found`);
    await this.assertCanAccessCellule(cellule, userId);
    await this.celluleRepo.remove(cellule);
    return { deleted: true };
  }

  private async assertCanAccessCellule(cellule: Cellule, userId?: string) {
    if (!userId) throw new ForbiddenException('Missing user');
    const scope = await this.getScope(userId);
    if (scope.isGlobal) return;
    if (!scope.departmentId) throw new ForbiddenException('No active department membership.');
    if (cellule.departmentId !== scope.departmentId) {
      throw new ForbiddenException('Cellule is outside your active department.');
    }
  }

  private async validateDepartment(id: number) {
    const exists = await this.departmentRepo.findOne({ where: { id } });
    if (!exists) throw new BadRequestException('Department does not exist');
    return id;
  }

  private async validateMembersInDepartment(ids: string[], allowed: Set<number>): Promise<number[]> {
    if (!Array.isArray(ids)) throw new BadRequestException('members must be an array');
    const numIds = ids.map(Number);
    if (numIds.length === 0) return [];
    const found = await this.userRepo.find({ where: { id: In(numIds) } });
    if (found.length !== numIds.length) throw new BadRequestException('One or more members do not exist');
    const outsiders = numIds.filter((id) => !allowed.has(id));
    if (outsiders.length) throw new BadRequestException('Some members do not belong to the department.');
    return numIds;
  }
}
