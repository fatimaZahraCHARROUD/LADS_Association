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
const TASK_STATUSES = ['todo', 'in-progress', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];

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
    departmentId?: string,
  ) {
    const scope = await this.getScope(userId);
    const filter: Record<string, unknown> = {};

    if (status && !TASK_STATUSES.includes(status)) {
      throw new BadRequestException('Invalid task status');
    }
    if (priority && !TASK_PRIORITIES.includes(priority)) {
      throw new BadRequestException('Invalid task priority');
    }

    if (scope.isGlobal) {
      if (assignedTo) filter.assignedTo = this.toObjectId(assignedTo, 'user');
      if (departmentId) {
        filter.departmentId = await this.validateDepartment(departmentId);
      }
    } else if (scope.role === 'Member') {
      if (!userId) return [];
      const currentUserId = this.toObjectId(userId, 'user');
      if (
        assignedTo &&
        String(this.toObjectId(assignedTo, 'user')) !== String(currentUserId)
      ) {
        throw new ForbiddenException('You can only view your own tasks.');
      }
      filter.assignedTo = currentUserId;
      if (departmentId) {
        const requestedDepartmentId = this.toObjectId(
          departmentId,
          'department',
        );
        const allowedDepartmentIds = await this.getUserDepartmentIds(userId);
        if (!allowedDepartmentIds.has(String(requestedDepartmentId))) {
          throw new ForbiddenException(
            'You do not have access to this department.',
          );
        }
        filter.departmentId = await this.validateDepartment(
          String(requestedDepartmentId),
        );
      }
    } else {
      if (!scope.departmentId) return [];
      if (
        departmentId &&
        String(this.toObjectId(departmentId, 'department')) !==
          String(scope.departmentId)
      ) {
        throw new ForbiddenException(
          'You can only view tasks in your active department.',
        );
      }
      filter.departmentId = scope.departmentId;
      if (assignedTo) {
        const assignee = await this.validateUser(assignedTo, 'assignedTo');
        const { allowed } = await this.getAllowedDepartmentMembers(
          scope.departmentId,
        );
        if (!allowed.has(String(assignee))) {
          throw new ForbiddenException(
            'The chosen member is not part of your department.',
          );
        }
        filter.assignedTo = assignee;
      }
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    return this.taskModel
      .find(filter)
      .populate('assignedTo', USER_FIELDS)
      .populate('objectiveId', 'title status')
      .populate('departmentId', 'name')
      .sort({ deadline: 1 })
      .exec();
  }

  async findOne(id: string, userId?: string) {
    const task = await this.taskModel
      .findById(this.toObjectId(id, 'task'))
      .populate('assignedTo', USER_FIELDS)
      .populate('objectiveId', 'title status')
      .populate('departmentId', 'name')
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
      if (dto.departmentId) {
        departmentId = await this.validateDepartment(dto.departmentId);
      } else {
        const assignedDepartments =
          await this.getUserDepartmentIds(String(assignedTo));
        if (assignedDepartments.size !== 1) {
          throw new BadRequestException(
            'Choose a department for this task.',
          );
        }
        departmentId = await this.validateDepartment(
          Array.from(assignedDepartments)[0],
        );
      }
    } else {
      if (!scope.departmentId) {
        throw new ForbiddenException(
          'You have no active department membership.',
        );
      }
      departmentId = scope.departmentId;
      if (
        dto.departmentId &&
        String(await this.validateDepartment(dto.departmentId)) !==
          String(departmentId)
      ) {
        throw new ForbiddenException(
          'You can only create tasks in your active department.',
        );
      }
    }

    if (!(await this.isDepartmentMember(String(assignedTo), departmentId))) {
      throw new ForbiddenException(
        'The chosen member is not part of your department.',
      );
    }

    let objectiveId: Types.ObjectId | null = null;
    if (dto.objectiveId) {
      objectiveId = await this.validateObjective(dto.objectiveId);
      const objective = await this.objectiveModel
        .findById(objectiveId)
        .select('departmentId')
        .lean()
        .exec();
      const raw =
        (objective?.departmentId as any)?._id ?? objective?.departmentId;
      if (String(raw) !== String(departmentId)) {
        throw new BadRequestException(
          'The chosen objective must belong to the task department.',
        );
      }
    }

    const status = dto.status ?? 'todo';
    const deadline = this.parseOptionalDate(dto.deadline, 'deadline');
    return this.taskModel.create({
      title: dto.title.trim(),
      description: dto.description ?? '',
      assignedTo,
      priority: dto.priority ?? 'medium',
      deadline,
      status,
      completedAt: status === 'done' ? new Date() : null,
      objectiveId,
      departmentId,
    });
  }

  // ─────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────

  async update(id: string, dto: UpdateTaskDto, userId?: string) {
    const taskId = this.toObjectId(id, 'task');
    const existing = await this.taskModel.findById(taskId).exec();
    if (!existing) throw new NotFoundException(`Task ${id} not found`);

    await this.assertCanAccessTask(existing, userId);
    const scope = await this.getScope(userId);
    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) {
      if (!dto.title.trim()) {
        throw new BadRequestException('Task title is required');
      }
      updates.title = dto.title.trim();
    }
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.deadline !== undefined) {
      updates.deadline = this.parseOptionalDate(dto.deadline, 'deadline');
    }

    const existingDepartmentId =
      (existing.departmentId as any)?._id ?? existing.departmentId;
    let departmentId = existingDepartmentId
      ? new Types.ObjectId(String(existingDepartmentId))
      : null;
    if (dto.departmentId !== undefined) {
      if (dto.departmentId === null || dto.departmentId === '') {
        throw new BadRequestException('Task department is required');
      }
      const requestedDepartmentId = await this.validateDepartment(
        dto.departmentId,
      );
      if (
        !scope.isGlobal &&
        String(requestedDepartmentId) !== String(scope.departmentId)
      ) {
        throw new ForbiddenException(
          'You can only assign tasks to your active department.',
        );
      }
      departmentId = requestedDepartmentId;
      updates.departmentId = requestedDepartmentId;
    }

    const assignedTo =
      dto.assignedTo !== undefined
        ? await this.validateUser(dto.assignedTo, 'assignedTo')
        : new Types.ObjectId(
            String((existing.assignedTo as any)?._id ?? existing.assignedTo),
          );
    if (dto.assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (
      departmentId &&
      !(await this.isDepartmentMember(String(assignedTo), departmentId))
    ) {
      throw new BadRequestException(
        'The assigned member does not belong to the task department.',
      );
    }

    if (dto.objectiveId !== undefined) {
      if (dto.objectiveId === null || dto.objectiveId === '') {
        updates.objectiveId = null;
      } else {
        const objectiveId = await this.validateObjective(dto.objectiveId);
        const objective = await this.objectiveModel
          .findById(objectiveId)
          .select('departmentId')
          .lean()
          .exec();
        const rawObjDept =
          (objective?.departmentId as any)?._id ?? objective?.departmentId;
        if (String(rawObjDept) !== String(departmentId)) {
          throw new BadRequestException(
            'The chosen objective must belong to the task department.',
          );
        }
        updates.objectiveId = objectiveId;
      }
    }

    if (dto.status !== undefined) {
      updates.completedAt =
        dto.status === 'done'
          ? existing.status === 'done' && existing.completedAt
            ? existing.completedAt
            : new Date()
          : null;
    }

    await this.taskModel
      .findByIdAndUpdate(taskId, updates, { new: true, runValidators: true })
      .exec();
    return this.findOne(id, userId);
  }

  // ─────────────────────────────────────────────
  //  STATUS
  // ─────────────────────────────────────────────

  async updateStatus(id: string, status: string, userId: string) {
    if (!TASK_STATUSES.includes(status)) {
      throw new BadRequestException('Invalid task status');
    }
    const taskId = this.toObjectId(id, 'task');
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) throw new NotFoundException(`Task ${id} not found`);

    await this.assertCanAccessTask(task, userId);
    return this.taskModel
      .findByIdAndUpdate(
        taskId,
        {
          status,
          completedAt:
            status === 'done'
              ? task.status === 'done' && task.completedAt
                ? task.completedAt
                : new Date()
              : null,
        },
        { new: true, runValidators: true },
      )
      .populate('assignedTo', USER_FIELDS)
      .populate('objectiveId', 'title status')
      .populate('departmentId', 'name')
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

  private toObjectId(id: string, label: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label} ID`);
    }
    return new Types.ObjectId(id);
  }

  private parseOptionalDate(value: string | null | undefined, label: string) {
    if (value === undefined || value === null || value === '') return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${label}`);
    }
    return date;
  }

  private async getUserDepartmentIds(userId: string): Promise<Set<string>> {
    const departmentIds = new Set<string>();
    if (!Types.ObjectId.isValid(userId)) return departmentIds;

    const userObjectId = new Types.ObjectId(userId);
    const user = await this.userModel
      .findById(userObjectId)
      .select('memberships departement')
      .lean()
      .exec();
    for (const membership of user?.memberships ?? []) {
      if (membership.departmentId) {
        departmentIds.add(String(membership.departmentId));
      }
    }
    for (const departmentId of user?.departement ?? []) {
      departmentIds.add(String(departmentId));
    }

    const departments = await this.departmentModel
      .find({
        $or: [
          { manager: userObjectId },
          { viceManager: userObjectId },
          { teamManagers: userObjectId },
          { members: userObjectId },
        ],
      })
      .select('_id')
      .lean()
      .exec();
    for (const department of departments) {
      departmentIds.add(String(department._id));
    }
    return departmentIds;
  }

  private async isDepartmentMember(
    userId: string,
    departmentId: Types.ObjectId,
  ) {
    const allowed = await this.getAllowedDepartmentMembers(departmentId);
    if (!allowed.exists) {
      throw new BadRequestException('Department does not exist');
    }
    if (allowed.allowed.has(userId)) return true;
    return (await this.getUserDepartmentIds(userId)).has(String(departmentId));
  }

  private async validateUser(
    id: string,
    label: string,
  ): Promise<Types.ObjectId> {
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
