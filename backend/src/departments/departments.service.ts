import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

const USER_FIELDS = 'fullName email role profileImage';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  findAll() {
    return this.departmentModel
      .find()
      .populate('manager', USER_FIELDS)
      .populate('viceManager', USER_FIELDS)
      .populate('teamManagers', USER_FIELDS)
      .populate('members', USER_FIELDS)
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string) {
    this.validateDepartmentId(id);
    const department = await this.departmentModel
      .findById(id)
      .populate('manager', USER_FIELDS)
      .populate('viceManager', USER_FIELDS)
      .populate('teamManagers', USER_FIELDS)
      .populate('members', USER_FIELDS)
      .exec();
    if (!department) throw new NotFoundException(`Department ${id} not found`);
    return department;
  }

  async create(dto: CreateDepartmentDto) {
    const name = this.validateName(dto.name);
    const manager = await this.validateUserId(dto.manager ?? null);
    const viceManager = await this.validateUserId(dto.viceManager ?? null);
    this.validateDistinctManagers(manager, viceManager);
    const teamManagers = await this.validateUserIds(dto.teamManagers ?? []);
    const members = await this.validateUserIds(dto.members ?? []);

    const department = await this.departmentModel.create({
      name,
      manager,
      viceManager,
      teamManagers,
      members,
    });
    return this.findOne(String(department._id));
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    this.validateDepartmentId(id);
    const current = await this.departmentModel.findById(id).exec();
    if (!current) throw new NotFoundException(`Department ${id} not found`);

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = this.validateName(dto.name);
    if (dto.manager !== undefined) {
      updates.manager = await this.validateUserId(dto.manager);
    }
    if (dto.viceManager !== undefined) {
      updates.viceManager = await this.validateUserId(dto.viceManager);
    }
    if (dto.teamManagers !== undefined) {
      updates.teamManagers = await this.validateUserIds(dto.teamManagers);
    }
    if (dto.members !== undefined) {
      updates.members = await this.validateUserIds(dto.members);
    }

    const manager = Object.prototype.hasOwnProperty.call(updates, 'manager')
      ? (updates.manager as Types.ObjectId | null)
      : current.manager;
    const viceManager = Object.prototype.hasOwnProperty.call(
      updates,
      'viceManager',
    )
      ? (updates.viceManager as Types.ObjectId | null)
      : current.viceManager;
    this.validateDistinctManagers(manager, viceManager);

    await this.departmentModel
      .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .exec();
    return this.findOne(id);
  }

  async assignManager(id: string, userId: string | null) {
    if (userId === undefined) {
      throw new BadRequestException('userId is required; use null to unassign');
    }
    return this.update(id, { manager: userId });
  }

  async assignViceManager(id: string, userId: string | null) {
    if (userId === undefined) {
      throw new BadRequestException('userId is required; use null to unassign');
    }
    return this.update(id, { viceManager: userId });
  }

  async assignTeamManagers(id: string, userIds: string[]) {
    if (!Array.isArray(userIds)) {
      throw new BadRequestException('userIds must be an array');
    }
    return this.update(id, { teamManagers: userIds });
  }

  async assignMembers(id: string, userIds: string[]) {
    if (!Array.isArray(userIds)) {
      throw new BadRequestException('userIds must be an array');
    }
    return this.update(id, { members: userIds });
  }

  async remove(id: string) {
    this.validateDepartmentId(id);
    const department = await this.departmentModel.findByIdAndDelete(id).exec();
    if (!department) throw new NotFoundException(`Department ${id} not found`);
    return { deleted: true };
  }

  private validateName(name: string) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new BadRequestException('Department name is required');
    }
    return name.trim();
  }

  private validateDepartmentId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid department ID');
    }
  }

  private async validateUserId(userId: string | null) {
    if (userId === null) return null;
    if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('A valid user ID is required');
    }

    const objectId = new Types.ObjectId(userId);
    const exists = await this.userModel.exists({ _id: objectId });
    if (!exists) throw new BadRequestException(`User ${userId} does not exist`);
    return objectId;
  }

  private async validateUserIds(userIds: string[]) {
    if (!Array.isArray(userIds)) {
      throw new BadRequestException('User IDs must be an array');
    }
    if (
      userIds.some(
        (userId) =>
          typeof userId !== 'string' || !Types.ObjectId.isValid(userId),
      )
    ) {
      throw new BadRequestException('All user IDs must be valid');
    }
    const normalizedUserIds = userIds.map((userId) => userId.toLowerCase());
    if (new Set(normalizedUserIds).size !== normalizedUserIds.length) {
      throw new BadRequestException('A user cannot be assigned more than once');
    }

    const objectIds = normalizedUserIds.map(
      (userId) => new Types.ObjectId(userId),
    );
    const existingCount = await this.userModel.countDocuments({
      _id: { $in: objectIds },
    });
    if (existingCount !== objectIds.length) {
      throw new BadRequestException('One or more users do not exist');
    }
    return objectIds;
  }

  private validateDistinctManagers(
    manager: Types.ObjectId | null,
    viceManager: Types.ObjectId | null,
  ) {
    if (manager && viceManager && manager.equals(viceManager)) {
      throw new BadRequestException(
        'Manager and Vice Manager must be different users',
      );
    }
  }
}
