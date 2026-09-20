import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department, DepartmentDocument } from './schemas/department.schema';

function uniqueIds(ids?: Array<string | null> | null) {
  return Array.from(new Set((ids ?? []).filter(Boolean))) as string[];
}

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  create(dto: CreateDepartmentDto) {
    const payload = {
      ...dto,
      name: dto.name?.trim(),
      description: dto.description || '',
      manager: dto.manager || null,
      viceManager: dto.viceManager || null,
      teamManagers: uniqueIds(dto.teamManagers),
      members: uniqueIds(dto.members),
    };

    return this.departmentModel.create(payload);
  }

  findAll() {
    return this.departmentModel
      .find()
      .populate('manager', 'fullName email profileImage')
      .populate('viceManager', 'fullName email profileImage')
      .populate('teamManagers', 'fullName email profileImage')
      .populate('members', 'fullName email profileImage')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const department = await this.departmentModel
      .findById(id)
      .populate('manager', 'fullName email profileImage')
      .populate('viceManager', 'fullName email profileImage')
      .populate('teamManagers', 'fullName email profileImage')
      .populate('members', 'fullName email profileImage')
      .exec();

    if (!department) throw new NotFoundException(`Department ${id} not found`);
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const existing = await this.departmentModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Department ${id} not found`);

    const payload = {
      ...dto,
      name: dto.name !== undefined ? dto.name.trim() : existing.name,
      description: dto.description !== undefined ? dto.description : existing.description,
      manager: dto.manager !== undefined ? dto.manager || null : existing.manager,
      viceManager: dto.viceManager !== undefined ? dto.viceManager || null : existing.viceManager,
      teamManagers: dto.teamManagers !== undefined ? uniqueIds(dto.teamManagers) : existing.teamManagers,
      members: dto.members !== undefined ? uniqueIds(dto.members) : existing.members,
    };

    const updated = await this.departmentModel
      .findByIdAndUpdate(id, payload, { new: true })
      .populate('manager', 'fullName email profileImage')
      .populate('viceManager', 'fullName email profileImage')
      .populate('teamManagers', 'fullName email profileImage')
      .populate('members', 'fullName email profileImage')
      .exec();

    return updated;
  }

  async remove(id: string) {
    const department = await this.departmentModel.findByIdAndDelete(id).exec();
    if (!department) throw new NotFoundException(`Department ${id} not found`);
    return { deleted: true };
  }
}
