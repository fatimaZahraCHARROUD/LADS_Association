import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Objective, ObjectiveDocument } from './schemas/objective.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';

const USER_FIELDS = 'fullName email profileImage';
const GLOBAL_ROLES = ['President', 'Director Executive'];

@Injectable()
export class ObjectivesService {
  constructor(
    @InjectModel(Objective.name)
    private readonly objectiveModel: Model<ObjectiveDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Resolve the caller's active department + role.
   * Global roles see everything.
   */
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

  // ───── READ ─────

  async findAll(userId?: string, status?: string) {
    const scope = await this.getScope(userId);
    const filter: Record<string, unknown> = {};

    if (scope.isGlobal) {
      // Global roles see all (optionally filter by status only).
    } else {
      // Responsable: ONLY their active membership's department.
      if (!scope.departmentId) return [];
      filter.departmentId = scope.departmentId;
    }
    if (status) filter.status = status;

    return this.objectiveModel
      .find(filter)
      .populate('departmentId', 'name')
      .populate('createdBy', USER_FIELDS)
      .sort({ weekStart: -1 })
      .exec();
  }

  async findOne(id: string, userId?: string) {
    const objective = await this.objectiveModel
      .findById(this.toObjectId(id, 'objective'))
      .populate('departmentId', 'name')
      .populate('createdBy', USER_FIELDS)
      .exec();
    if (!objective) throw new NotFoundException(`Objective ${id} not found`);

    await this.assertCanAccessObjective(objective, userId);
    return objective;
  }

  // ───── CREATE ─────

  async create(dto: CreateObjectiveDto, userId?: string) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Objective title is required');
    }
    if (!dto.weekStart || !dto.weekEnd) {
      throw new BadRequestException('weekStart and weekEnd are required');
    }
    if (!userId) throw new ForbiddenException('Missing user');

    const scope = await this.getScope(userId);

    // Department is ALWAYS the caller's active department for Responsables.
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
    }

    const data: any = {
      title: dto.title.trim(),
      description: dto.description ?? '',
      weekStart: new Date(dto.weekStart),
      weekEnd: new Date(dto.weekEnd),
      target: dto.target ?? 0,
      achievement: dto.achievement ?? 0,
      status: dto.status ?? 'in-progress',
      departmentId,
      createdBy: new Types.ObjectId(userId),
    };
    data.progress = this.computeProgress(data.target, data.achievement);

    return this.objectiveModel.create(data);
  }

  // ───── UPDATE ─────

  async update(id: string, dto: UpdateObjectiveDto, userId?: string) {
    const existing = await this.objectiveModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Objective ${id} not found`);

    await this.assertCanAccessObjective(existing, userId);
    const scope = await this.getScope(userId);

    const updates: Record<string, unknown> = {};

    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.weekStart !== undefined) updates.weekStart = new Date(dto.weekStart);
    if (dto.weekEnd !== undefined) updates.weekEnd = new Date(dto.weekEnd);
    if (dto.status !== undefined) updates.status = dto.status;

    // Only global roles can move an objective between departments.
    if (scope.isGlobal && dto.departmentId !== undefined) {
      updates.departmentId = dto.departmentId
        ? await this.validateDepartment(dto.departmentId)
        : null;
    }

    const target = dto.target !== undefined ? dto.target : existing.target;
    const achievement =
      dto.achievement !== undefined ? dto.achievement : existing.achievement;
    updates.target = target;
    updates.achievement = achievement;
    updates.progress = this.computeProgress(target, achievement);

    await this.objectiveModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
    return this.findOne(id, userId);
  }

  // ───── DELETE ─────

  async remove(id: string, userId?: string) {
    const objective = await this.objectiveModel
      .findById(this.toObjectId(id, 'objective'))
      .exec();
    if (!objective) throw new NotFoundException(`Objective ${id} not found`);

    await this.assertCanAccessObjective(objective, userId);

    await this.objectiveModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }

  // ───── ACCESS ─────

  private async assertCanAccessObjective(
    objective: ObjectiveDocument,
    userId?: string,
  ) {
    if (!userId) throw new ForbiddenException('Missing user');
    const scope = await this.getScope(userId);
    if (scope.isGlobal) return;

    if (!scope.departmentId) {
      throw new ForbiddenException('No active department membership.');
    }

    // Handle both raw ObjectId and populated { _id, name }.
    const rawDeptId =
      (objective.departmentId as any)?._id ?? objective.departmentId;

    if (String(rawDeptId) !== String(scope.departmentId)) {
      throw new ForbiddenException(
        'Objective is outside your active department.',
      );
    }
  }

  // ───── HELPERS ─────

  private computeProgress(target: number, achievement: number): number {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((achievement / target) * 100));
  }

  private toObjectId(id: string, label: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label} ID`);
    }
    return new Types.ObjectId(id);
  }

  private async validateDepartment(id: string): Promise<Types.ObjectId> {
    const oid = this.toObjectId(id, 'department');
    const exists = await this.departmentModel.exists({ _id: oid });
    if (!exists) throw new BadRequestException('Department does not exist');
    return oid;
  }
}