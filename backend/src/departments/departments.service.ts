import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
  ) {}

  create(dto: CreateDepartmentDto) {
    return this.departmentModel.create(dto);
  }

  findAll() {
    return this.departmentModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string) {
    const dept = await this.departmentModel.findById(id).exec();
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const dept = await this.departmentModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async remove(id: string) {
    const dept = await this.departmentModel.findByIdAndDelete(id).exec();
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return { deleted: true };
  }
}