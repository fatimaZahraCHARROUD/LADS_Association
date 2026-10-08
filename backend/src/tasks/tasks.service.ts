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
import { Objective, ObjectiveDocument } from '../objectives/schemas/objective.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const USER_FIELDS = 'fullName email profileImage';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Objective.name)
    private readonly objectiveModel: Model<ObjectiveDocument>,
  ) {}

  // GET /tasks — filtres optionnels: status, assignedTo, priority, objectiveId
  findAll(status?: string, assignedTo?: string, priority?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = this.toObjectId(assignedTo, 'user');
    if (priority) filter.priority = priority;

    return this.taskModel
      .find(filter)
      .populate('assignedTo', USER_FIELDS)
      .populate('objectiveId', 'title status')
      .sort({ deadline: 1 })
      .exec();
  }

  // GET /tasks/:id
  async findOne(id: string) {
    const task = await this.taskModel
      .findById(this.toObjectId(id, 'task'))
      .populate('assignedTo', USER_FIELDS)
      .populate('objectiveId', 'title status')
      .exec();
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  // POST /tasks — le Responsable (ou un manager) assigne une tâche
  async create(dto: CreateTaskDto) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Task title is required');
    }
    const assignedTo = await this.validateUser(dto.assignedTo, 'assignedTo');
    let objectiveId: Types.ObjectId | null = null;
    if (dto.objectiveId) {
      objectiveId = await this.validateObjective(dto.objectiveId);
    }

    return this.taskModel.create({
      title: dto.title.trim(),
      description: dto.description ?? '',
      assignedTo,
      priority: dto.priority ?? 'medium',
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      status: dto.status ?? 'todo',
      objectiveId,
    });
  }

  // PATCH /tasks/:id
  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.taskModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Task ${id} not found`);

    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.deadline !== undefined) {
      updates.deadline = dto.deadline ? new Date(dto.deadline) : null;
    }
    if (dto.assignedTo !== undefined) {
      updates.assignedTo = await this.validateUser(dto.assignedTo, 'assignedTo');
    }
    if (dto.objectiveId !== undefined) {
      updates.objectiveId = dto.objectiveId
        ? await this.validateObjective(dto.objectiveId)
        : null;
    }

    return this.taskModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
  }

  // PATCH /tasks/:id/status — un MEMBRE ne peut changer que SES tâches
  async updateStatus(id: string, status: string, userId: string) {
    const task = await this.taskModel.findById(id).exec();
    if (!task) throw new NotFoundException(`Task ${id} not found`);

    // Le rôle actif de l'utilisateur connecté
    const role = await this.getUserRole(userId);

    // Si c'est un simple membre, il a le droit de modifier UNIQUEMENT
    // les tâches qui lui sont assignées
    if (role === 'Member' && String(task.assignedTo) !== String(userId)) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    return this.taskModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  // DELETE /tasks/:id
  async remove(id: string) {
    const task = await this.taskModel
      .findByIdAndDelete(this.toObjectId(id, 'task'))
      .exec();
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return { deleted: true };
  }

  // ────────────── Helpers ──────────────

  // Récupère le rôle ACTIF de l'utilisateur (même logique que ActiveRoleGuard)
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
}