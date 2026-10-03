import {
  BadRequestException,
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

  // GET /objectives  avec filtres optionnels: departmentId, status
  findAll(departmentId?: string, status?: string) {
    const filter: Record<string, unknown> = {};
    if (departmentId) {
      filter.departmentId = this.toObjectId(departmentId, 'department');
    }
    if (status) filter.status = status;

    return this.objectiveModel
      .find(filter)
      .populate('departmentId', 'name')
      .populate('createdBy', USER_FIELDS)
      .sort({ weekStart: -1 })
      .exec();
  }

  // GET /objectives/:id
  async findOne(id: string) {
    const objective = await this.objectiveModel
      .findById(this.toObjectId(id, 'objective'))
      .populate('departmentId', 'name')
      .populate('createdBy', USER_FIELDS)
      .exec();
    if (!objective) throw new NotFoundException(`Objective ${id} not found`);
    return objective;
  }

  // POST /objectives — userId = l'utilisateur connecté (le Responsable)
  async create(dto: CreateObjectiveDto, userId: string) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Objective title is required');
    }
    if (!dto.weekStart || !dto.weekEnd) {
      throw new BadRequestException('weekStart and weekEnd are required');
    }

    let departmentId: Types.ObjectId | null = null;
    if (dto.departmentId) {
      departmentId = await this.validateDepartment(dto.departmentId);
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
      createdBy: userId,
    };
    // La progression est calculée automatiquement (achievement / target * 100)
    data.progress = this.computeProgress(data.target, data.achievement);

    return this.objectiveModel.create(data);
  }

  // PATCH /objectives/:id
  async update(id: string, dto: UpdateObjectiveDto) {
    const existing = await this.objectiveModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Objective ${id} not found`);

    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.weekStart !== undefined) updates.weekStart = new Date(dto.weekStart);
    if (dto.weekEnd !== undefined) updates.weekEnd = new Date(dto.weekEnd);
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.departmentId !== undefined) {
      updates.departmentId = dto.departmentId
        ? await this.validateDepartment(dto.departmentId)
        : null;
    }

    // Nouvelle target / achievement => on recalcule la progression
    const target = dto.target !== undefined ? dto.target : existing.target;
    const achievement =
      dto.achievement !== undefined ? dto.achievement : existing.achievement;
    updates.target = target;
    updates.achievement = achievement;
    updates.progress = this.computeProgress(target, achievement);

    return this.objectiveModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
  }

  // DELETE /objectives/:id
  async remove(id: string) {
    const objective = await this.objectiveModel
      .findByIdAndDelete(this.toObjectId(id, 'objective'))
      .exec();
    if (!objective) throw new NotFoundException(`Objective ${id} not found`);
    return { deleted: true };
  }

  // progression en % (entre 0 et 100), 0 si pas de cible
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