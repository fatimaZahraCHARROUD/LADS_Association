import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cellule, CelluleDocument } from './schemas/cellule.schema';
import {
  Department,
  DepartmentDocument,
} from '../departments/schemas/department.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateCelluleDto } from './dto/create-cellule.dto';
import { UpdateCelluleDto } from './dto/update-cellule.dto';

// Champs à renvoyer quand on "populate" un user (au lieu de tout le document)
const USER_FIELDS = 'fullName email profileImage role';

@Injectable()
export class CellulesService {
  constructor(
    @InjectModel(Cellule.name)
    private readonly celluleModel: Model<CelluleDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // GET /cellules  (avec filtre optionnel ?departmentId=...)
  findAll(departmentId?: string) {
    const filter: Record<string, unknown> = {};
    if (departmentId) {
      filter.departmentId = this.toObjectId(departmentId, 'department');
    }
    return this.celluleModel
      .find(filter)
      .populate('departmentId', 'name')
      .populate('managerId', USER_FIELDS)
      .populate('members', USER_FIELDS)
      .sort({ name: 1 })
      .exec();
  }

  // GET /cellules/:id
  async findOne(id: string) {
    const cellule = await this.celluleModel
      .findById(this.toObjectId(id, 'cellule'))
      .populate('departmentId', 'name')
      .populate('managerId', USER_FIELDS)
      .populate('members', USER_FIELDS)
      .exec();
    if (!cellule) throw new NotFoundException(`Cellule ${id} not found`);
    return cellule;
  }

  // POST /cellules
  async create(dto: CreateCelluleDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Cellule name is required');
    }
    // On valide que les références existent vraiment en base
    const departmentId = await this.validateDepartment(dto.departmentId);
    const managerId = await this.validateUser(dto.managerId, 'manager');
    const members = await this.validateUsers(dto.members ?? []);

    return this.celluleModel.create({
      name: dto.name.trim(),
      description: dto.description ?? '',
      departmentId,
      managerId,
      members,
      status: dto.status ?? 'active',
    });
  }

  // PATCH /cellules/:id
  async update(id: string, dto: UpdateCelluleDto) {
    const existing = await this.celluleModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Cellule ${id} not found`);

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new BadRequestException('Cellule name is required');
      }
      updates.name = dto.name.trim();
    }
    if (dto.description !== undefined) updates.description = dto.description;
    // On re-valide seulement les champs qui sont envoyés
    if (dto.departmentId !== undefined) {
      updates.departmentId = await this.validateDepartment(dto.departmentId);
    }
    if (dto.managerId !== undefined) {
      updates.managerId = await this.validateUser(dto.managerId, 'manager');
    }
    if (dto.members !== undefined) {
      updates.members = await this.validateUsers(dto.members);
    }
    if (dto.status !== undefined) updates.status = dto.status;

    await this.celluleModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
    return this.findOne(id);
  }

  // DELETE /cellules/:id
  async remove(id: string) {
    const cellule = await this.celluleModel
      .findByIdAndDelete(this.toObjectId(id, 'cellule'))
      .exec();
    if (!cellule) throw new NotFoundException(`Cellule ${id} not found`);
    return { deleted: true };
  }

  // ────────────── Validation des références ──────────────

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

  private async validateUser(id: string, label: string): Promise<Types.ObjectId> {
    const oid = this.toObjectId(id, label);
    const exists = await this.userModel.exists({ _id: oid });
    if (!exists) throw new BadRequestException(`${label} does not exist`);
    return oid;
  }

  private async validateUsers(ids: string[]): Promise<Types.ObjectId[]> {
    if (!Array.isArray(ids)) {
      throw new BadRequestException('members must be an array');
    }
    const oids = ids.map((id) => this.toObjectId(id, 'member'));
    const count = await this.userModel.countDocuments({ _id: { $in: oids } });
    if (count !== oids.length) {
      throw new BadRequestException('One or more members do not exist');
    }
    return oids;
  }
}