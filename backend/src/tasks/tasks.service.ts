import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Objective } from '../objectives/entities/objective.entity';
import { Department } from '../departments/entities/department.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const GLOBAL_ROLES = ['President', 'Director Executive'];

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Objective) private readonly objectiveRepo: Repository<Objective>,
    @InjectRepository(Department) private readonly departmentRepo: Repository<Department>,
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

  async findAll(userId?: string, status?: string, assignedTo?: string, priority?: string) {
    const scope = await this.getScope(userId);
    const where: Record<string, unknown> = {};

    if (scope.isGlobal) {
      if (assignedTo) where['assignedTo'] = Number(assignedTo);
    } else if (scope.role === 'Member') {
      if (!userId) return [];
      where['assignedTo'] = Number(userId);
    } else {
      if (!scope.departmentId) return [];
      where['departmentId'] = scope.departmentId;
    }

    if (status) where['status'] = status;
    if (priority) where['priority'] = priority;

    return this.taskRepo.find({ where, order: { deadline: 'ASC' } });
  }

  async findOne(id: string, userId?: string) {
    const task = await this.taskRepo.findOne({ where: { id: Number(id) } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    await this.assertCanAccessTask(task, userId);
    return task;
  }

  async create(dto: CreateTaskDto, userId?: string) {
    if (!dto.title?.trim()) throw new BadRequestException('Task title is required');
    if (!userId) throw new ForbiddenException('Missing user');

    const assignedTo = await this.validateUser(Number(dto.assignedTo));
    const scope = await this.getScope(userId);

    let departmentId: number | null;
    if (scope.isGlobal) {
      departmentId = dto.departmentId ? await this.validateDepartment(Number(dto.departmentId)) : null;
    } else {
      if (!scope.departmentId) throw new ForbiddenException('You have no active department membership.');
      departmentId = scope.departmentId;
      const { allowed } = await this.getAllowedDepartmentMembers(departmentId);
      if (!allowed.has(assignedTo)) throw new ForbiddenException('The chosen member is not part of your department.');
    }

    let objectiveId: number | null = null;
    if (dto.objectiveId) {
      objectiveId = await this.validateObjective(Number(dto.objectiveId));
      if (!scope.isGlobal && departmentId) {
        const objective = await this.objectiveRepo.findOne({ where: { id: objectiveId } });
        if (objective?.departmentId !== departmentId) {
          throw new ForbiddenException('The chosen objective is not in your department.');
        }
      }
    }

    const task = this.taskRepo.create({
      title: dto.title.trim(),
      description: dto.description ?? '',
      assignedTo,
      priority: dto.priority ?? 'medium',
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      status: dto.status ?? 'todo',
      objectiveId,
      departmentId,
    } as Partial<Task>);

    return this.taskRepo.save(task);
  }

  async update(id: string, dto: UpdateTaskDto, userId?: string) {
    const existing = await this.taskRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Task ${id} not found`);
    await this.assertCanAccessTask(existing, userId);
    const scope = await this.getScope(userId);

    if (dto.title !== undefined) existing.title = dto.title.trim();
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.priority !== undefined) existing.priority = dto.priority;
    if (dto.status !== undefined) existing.status = dto.status;
    if (dto.deadline !== undefined) existing.deadline = dto.deadline ? new Date(dto.deadline) : null;

    if (dto.assignedTo !== undefined) {
      const assignedTo = await this.validateUser(Number(dto.assignedTo));
      if (!scope.isGlobal && existing.departmentId) {
        const { allowed } = await this.getAllowedDepartmentMembers(existing.departmentId);
        if (!allowed.has(assignedTo)) throw new ForbiddenException("The chosen member is not part of this task's department.");
      }
      existing.assignedTo = assignedTo;
    }

    if (dto.objectiveId !== undefined) {
      if (!dto.objectiveId) {
        existing.objectiveId = null;
      } else {
        const objectiveId = await this.validateObjective(Number(dto.objectiveId));
        if (!scope.isGlobal && existing.departmentId) {
          const objective = await this.objectiveRepo.findOne({ where: { id: objectiveId } });
          if (objective?.departmentId !== existing.departmentId) {
            throw new ForbiddenException("The chosen objective is not in this task's department.");
          }
        }
        existing.objectiveId = objectiveId;
      }
    }

    return this.taskRepo.save(existing);
  }

  async updateStatus(id: string, status: string, userId: string) {
    const task = await this.taskRepo.findOne({ where: { id: Number(id) } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);

    const scope = await this.getScope(userId);
    if (scope.role === 'Member' && task.assignedTo !== Number(userId)) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    task.status = status;
    return this.taskRepo.save(task);
  }

  async remove(id: string, userId?: string) {
    const task = await this.taskRepo.findOne({ where: { id: Number(id) } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    await this.assertCanAccessTask(task, userId);
    await this.taskRepo.remove(task);
    return { deleted: true };
  }

  private async assertCanAccessTask(task: Task, userId?: string) {
    if (!userId) throw new ForbiddenException('Missing user');
    const scope = await this.getScope(userId);
    if (scope.isGlobal) return;

    if (scope.role === 'Member') {
      if (task.assignedTo !== Number(userId)) throw new ForbiddenException('You can only access your own tasks.');
      return;
    }

    if (!scope.departmentId) throw new ForbiddenException('No active department membership.');
    if (task.departmentId !== scope.departmentId) throw new ForbiddenException('Task is outside your active department.');
  }

  private async validateUser(id: number): Promise<number> {
    const exists = await this.userRepo.findOne({ where: { id } });
    if (!exists) throw new BadRequestException(`User ${id} does not exist`);
    return id;
  }

  private async validateObjective(id: number): Promise<number> {
    const exists = await this.objectiveRepo.findOne({ where: { id } });
    if (!exists) throw new BadRequestException('Objective does not exist');
    return id;
  }

  private async validateDepartment(id: number): Promise<number> {
    const exists = await this.departmentRepo.findOne({ where: { id } });
    if (!exists) throw new BadRequestException('Department does not exist');
    return id;
  }
}
