import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Objective,
  ObjectiveDocument,
} from '../objectives/schemas/objective.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const USER_FIELDS = 'fullName email profileImage';
const GLOBAL_ROLES = ['President', 'Director Executive'];

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Objective.name)
    private readonly objectiveModel: Model<ObjectiveDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  // ─────────────────────────────────────────────
  //  SCOPE
  // ─────────────────────────────────────────────

  private async getScope(userId?: string): Promise<{
    role: string | null;
    departmentId: Types.ObjectId | null;
    isGlobal: boolean;
  }> {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return { role: null, departmentId: null, isGlobal: false };
    }

    const user = await this.userModel
      .findById(userId)
      .select('activeMembershipId memberships isAdmin role')
      .lean()
      .exec();

    if (!user) return { role: null, departmentId: null, isGlobal: false };

    if (user.isAdmin === true || (user.role ?? []).includes('President')) {
      return { role: 'President', departmentId: null, isGlobal: true };
    }

    const active = (user.memberships ?? []).find(
      (m: any) => String(m._id) === String(user.activeMembershipId),
    );
    const role = active?.role ?? null;
    const isGlobal = GLOBAL_ROLES.includes(role ?? '');
    const departmentId =
      active?.departmentId && Types.ObjectId.isValid(String(active.departmentId))
        ? new Types.ObjectId(String(active.departmentId))
        : null;

    return { role, departmentId, isGlobal };
  }

  private async getAllowedDepartmentMembers(
    departmentId: Types.ObjectId,
  ): Promise<{ allowed: Set<string>; exists: boolean }> {
    const dept = await this.departmentModel
      .findById(departmentId)
      .select('manager viceManager teamManagers members')
      .lean()
      .exec();

    if (!dept) return { allowed: new Set(), exists: false };

    const allowed = new Set<string>();
    if (dept.manager) allowed.add(String(dept.manager));
    if (dept.viceManager) allowed.add(String(dept.viceManager));
    (dept.teamManagers ?? []).forEach((u: any) => allowed.add(String(u)));
    (dept.members ?? []).forEach((u: any) => allowed.add(String(u)));

    return { allowed, exists: true };
  }

  // ─────────────────────────────────────────────
  //  READ
  // ─────────────────────────────────────────────

  async findAll(
    userId?: string,
    status?: string,
    assignedTo?: string,
    priority?: string,
  ) {
    const scope = await this.getScope(userId);
    const filter: Record<string, unknown> = {};

    if (scope.isGlobal) {
      if (assignedTo) filter.assignedTo = this.toObjectId(assignedTo, 'user');
    } else if (scope.role === 'Member') {
      // A member only sees their own tasks.
      if (!userId) return [];
      filter.assignedTo = new Types.ObjectId(userId);
    } else {
      // Responsable / Team Manager: only the active dept's tasks.
      if (!scope.departmentId) return [];
      filter.departmentId = scope.departmentId;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    return this.taskModel
      .find(filter)
      .populate('assignedTo', USER_FIELDS)
      .populate('objectiveId', 'title status')
      .sort({ deadline: 1 })
      .exec();
  }

  async findOne(id: string, userId?: string) {
    const task = await this.taskModel
      .findById(this.toObjectId(id, 'task'))
      .populate('assignedTo', USER_FIELDS)
      .populate('objectiveId', 'title status')
      .exec();
    if (!task) throw new NotFoundException(`Task ${id} not found`);

    await this.assertCanAccessTask(task, userId);
    return task;
  }

  // ─────────────────────────────────────────────
  //  CREATE
  // ─────────────────────────────────────────────

  async create(dto: CreateTaskDto, userId?: string) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Task title is required');
    }
    if (!userId) throw new ForbiddenException('Missing user');

    const assignedTo = await this.validateUser(dto.assignedTo, 'assignedTo');
    const scope = await this.getScope(userId);

    let departmentId: Types.ObjectId | null;
    if (scope.isGlobal) {
      departmentId = dto.departmentId
        ? await this.validateDepartment(dto.departmentId)
        : null;
    } else {
      if (!scope.departmentId) {
        throw new ForbiddenException(
          'You have no active department membership.',
        );
      }
      departmentId = scope.departmentId;

      const { allowed } = await this.getAllowedDepartmentMembers(departmentId);
      if (!allowed.has(String(assignedTo))) {
        throw new ForbiddenException(
          'The chosen member is not part of your department.',
        );
      }
    }

    // objective must belong to the same department (or be null).
    let objectiveId: Types.ObjectId | null = null;
    if (dto.objectiveId) {
      objectiveId = await this.validateObjective(dto.objectiveId);
      if (!scope.isGlobal && departmentId) {
        const objective = await this.objectiveModel
          .findById(objectiveId)
          .select('departmentId')
          .lean()
          .exec();
        const raw =
          (objective?.departmentId as any)?._id ?? objective?.departmentId;
        if (String(raw) !== String(departmentId)) {
          throw new ForbiddenException(
            'The chosen objective is not in your department.',
          );
        }
      }
    }

    return this.taskModel.create({
      title: dto.title.trim(),
      description: dto.description ?? '',
      assignedTo,
      priority: dto.priority ?? 'medium',
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      status: dto.status ?? 'todo',
      objectiveId,
      departmentId,
    });
  }

  // ─────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────

  async update(id: string, dto: UpdateTaskDto, userId?: string) {
    const existing = await this.taskModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Task ${id} not found`);

    await this.assertCanAccessTask(existing, userId);
    const scope = await this.getScope(userId);

    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.deadline !== undefined) {
      updates.deadline = dto.deadline ? new Date(dto.deadline) : null;
    }

    if (dto.assignedTo !== undefined) {
      const assignedTo = await this.validateUser(dto.assignedTo, 'assignedTo');
      if (!scope.isGlobal) {
        // New assignee must be in the task's existing department.
        const taskDeptId =
          (existing.departmentId as any)?._id ?? existing.departmentId;
        if (!taskDeptId) {
          throw new ForbiddenException(
            'Task has no department; cannot reassign.',
          );
        }
        const { allowed } = await this.getAllowedDepartmentMembers(
          new Types.ObjectId(String(taskDeptId)),
        );
        if (!allowed.has(String(assignedTo))) {
          throw new ForbiddenException(
            'The chosen member is not part of this task\'s department.',
          );
        }
      }
      updates.assignedTo = assignedTo;
    }

    if (dto.objectiveId !== undefined) {
      if (dto.objectiveId === null || dto.objectiveId === '') {
        updates.objectiveId = null;
      } else {
        const objectiveId = await this.validateObjective(dto.objectiveId);
        if (!scope.isGlobal) {
          const taskDeptId =
            (existing.departmentId as any)?._id ?? existing.departmentId;
          const objective = await this.objectiveModel
            .findById(objectiveId)
            .select('departmentId')
            .lean()
            .exec();
          const rawObjDept =
            (objective?.departmentId as any)?._id ?? objective?.departmentId;
          if (String(rawObjDept) !== String(taskDeptId)) {
            throw new ForbiddenException(
              'The chosen objective is not in this task\'s department.',
            );
          }
        }
        updates.objectiveId = objectiveId;
      }
    }

    await this.taskModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
    return this.findOne(id, userId);
  }

  // ─────────────────────────────────────────────
  //  STATUS
  // ─────────────────────────────────────────────

  async updateStatus(id: string, status: string, userId: string) {
    const task = await this.taskModel.findById(id).exec();
    if (!task) throw new NotFoundException(`Task ${id} not found`);

    const role = await this.getUserRole(userId);

    if (role === 'Member' && String(task.assignedTo) !== String(userId)) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    return this.taskModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  // ─────────────────────────────────────────────
  //  DELETE
  // ─────────────────────────────────────────────

  async remove(id: string, userId?: string) {
    const task = await this.taskModel
      .findById(this.toObjectId(id, 'task'))
      .exec();
    if (!task) throw new NotFoundException(`Task ${id} not found`);

    await this.assertCanAccessTask(task, userId);

    await this.taskModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }

  // ─────────────────────────────────────────────
  //  ACCESS
  // ─────────────────────────────────────────────

  private async assertCanAccessTask(task: TaskDocument, userId?: string) {
    if (!userId) throw new ForbiddenException('Missing user');
    const scope = await this.getScope(userId);
    if (scope.isGlobal) return;

    const assignedToId = (task.assignedTo as any)?._id ?? task.assignedTo;

    if (scope.role === 'Member') {
      if (String(assignedToId) !== String(userId)) {
        throw new ForbiddenException('You can only access your own tasks.');
      }
      return;
    }

    if (!scope.departmentId) {
      throw new ForbiddenException('No active department membership.');
    }
    const rawTaskDept =
      (task.departmentId as any)?._id ?? task.departmentId;
    if (String(rawTaskDept) !== String(scope.departmentId)) {
      throw new ForbiddenException(
        'Task is outside your active department.',
      );
    }
  }

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────

  private async getUserRole(userId: string): Promise<string | null> {
    const user = await this.userModel
      .findById(userId)
      .select('memberships activeMembershipId isAdmin role')
      .lean()
      .exec();
    if (!user) return null;
    if (user.isAdmin === true || (user.role ?? []).includes('President')) {
      return 'President';
    }
    const active = (user.memberships ?? []).find(
      (m: any) => String(m._id) === String(user.activeMembershipId),
    );
    return active?.role ?? null;
  }

  private toObjectId(id: string, label: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label} ID`);
    }
    return new Types.ObjectId(id);
  }

  private async validateUser(id: string, label: string): Promise<Types.ObjectId> {
    const oid = this.toObjectId(id, label);
    const exists = await this.userModel.exists({ _id: oid });
    if (!exists) throw new BadRequestException(`${label} does not exist`);
    return oid;
  }

  private async validateObjective(id: string): Promise<Types.ObjectId> {
    const oid = this.toObjectId(id, 'objective');
    const exists = await this.objectiveModel.exists({ _id: oid });
    if (!exists) throw new BadRequestException('Objective does not exist');
    return oid;
  }

  private async validateDepartment(id: string): Promise<Types.ObjectId> {
    const oid = this.toObjectId(id, 'department');
    const exists = await this.departmentModel.exists({ _id: oid });
    if (!exists) throw new BadRequestException('Department does not exist');
    return oid;
  }
}