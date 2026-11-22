import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Objective } from './entities/objective.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';

const GLOBAL_ROLES = ['President', 'Director Executive'];

@Injectable()
export class ObjectivesService {
  constructor(
    @InjectRepository(Objective) private readonly objectiveRepo: Repository<Objective>,
    @InjectRepository(Department) private readonly departmentRepo: Repository<Department>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private async getScope(userId?: string) {
    if (!userId) return { role: null, departmentId: null, isGlobal: false };
    const numId = Number(userId);
    if (isNaN(numId)) return { role: null, departmentId: null, isGlobal: false };

    const user = await this.userRepo.findOne({ where: { id: numId }, relations: ['memberships'] });
    if (!user) return { role: null, departmentId: null, isGlobal: false };

    if (user.isAdmin === true || (user.role ?? []).includes('President')) {
      return { role: 'President', departmentId: null, isGlobal: true };
    }

    const activeMembership = (user.memberships ?? []).find((m: any) => m.id === user.activeMembershipId);
    const role = activeMembership?.role ?? null;
    const isGlobal = GLOBAL_ROLES.includes(role ?? '');
    const departmentId = activeMembership?.departmentId ?? null;

    return { role, departmentId, isGlobal };
  }

  async findAll(userId?: string, status?: string) {
    const scope = await this.getScope(userId);
    const where: Record<string, unknown> = {};

    if (!scope.isGlobal) {
      if (!scope.departmentId) return [];
      where['departmentId'] = scope.departmentId;
    }
    if (status) where['status'] = status;

    return this.objectiveRepo.find({ where, order: { weekStart: 'DESC' } });
  }

  async findOne(id: string, userId?: string) {
    const objective = await this.objectiveRepo.findOne({ where: { id: Number(id) } });
    if (!objective) throw new NotFoundException(`Objective ${id} not found`);
    await this.assertCanAccessObjective(objective, userId);
    return objective;
  }

  async create(dto: CreateObjectiveDto, userId?: string) {
    if (!dto.title?.trim()) throw new BadRequestException('Objective title is required');
    if (!dto.weekStart || !dto.weekEnd) throw new BadRequestException('weekStart and weekEnd are required');
    if (!userId) throw new ForbiddenException('Missing user');

    const scope = await this.getScope(userId);
    let departmentId: number | null;

    if (scope.isGlobal) {
      departmentId = dto.departmentId ? await this.validateDepartment(Number(dto.departmentId)) : null;
    } else {
      if (!scope.departmentId) throw new ForbiddenException('You have no active department membership.');
      departmentId = scope.departmentId;
    }

    const target = dto.target ?? 0;
    const achievement = dto.achievement ?? 0;
    const progress = this.computeProgress(target, achievement);

    const objective = this.objectiveRepo.create({
      title: dto.title.trim(),
      description: dto.description ?? '',
      weekStart: new Date(dto.weekStart),
      weekEnd: new Date(dto.weekEnd),
      target,
      achievement,
      progress,
      status: dto.status ?? 'in-progress',
      departmentId,
      createdBy: Number(userId),
    } as Partial<Objective>);

    return this.objectiveRepo.save(objective);
  }

  async update(id: string, dto: UpdateObjectiveDto, userId?: string) {
    const existing = await this.objectiveRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Objective ${id} not found`);
    await this.assertCanAccessObjective(existing, userId);
    const scope = await this.getScope(userId);

    if (dto.title !== undefined) existing.title = dto.title.trim();
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.weekStart !== undefined) existing.weekStart = new Date(dto.weekStart);
    if (dto.weekEnd !== undefined) existing.weekEnd = new Date(dto.weekEnd);
    if (dto.status !== undefined) existing.status = dto.status;

    if (scope.isGlobal && dto.departmentId !== undefined) {
      existing.departmentId = dto.departmentId ? await this.validateDepartment(Number(dto.departmentId)) : null;
    }

    const target = dto.target !== undefined ? dto.target : existing.target;
    const achievement = dto.achievement !== undefined ? dto.achievement : existing.achievement;
    existing.target = target;
    existing.achievement = achievement;
    existing.progress = this.computeProgress(target, achievement);

    return this.objectiveRepo.save(existing);
  }

  async remove(id: string, userId?: string) {
    const objective = await this.objectiveRepo.findOne({ where: { id: Number(id) } });
    if (!objective) throw new NotFoundException(`Objective ${id} not found`);
    await this.assertCanAccessObjective(objective, userId);
    await this.objectiveRepo.remove(objective);
    return { deleted: true };
  }

  private async assertCanAccessObjective(objective: Objective, userId?: string) {
    if (!userId) throw new ForbiddenException('Missing user');
    const scope = await this.getScope(userId);
    if (scope.isGlobal) return;
    if (!scope.departmentId) throw new ForbiddenException('No active department membership.');
    if (objective.departmentId !== scope.departmentId) {
      throw new ForbiddenException('Objective is outside your active department.');
    }
  }

  private computeProgress(target: number, achievement: number): number {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((achievement / target) * 100));
  }

  private async validateDepartment(id: number): Promise<number> {
    const exists = await this.departmentRepo.findOne({ where: { id } });
    if (!exists) throw new BadRequestException('Department does not exist');
    return id;
  }
}
