import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}

  create(dto: CreateRoleDto) {
    return this.roleModel.create(dto);
  }

  findAll() {
    return this.roleModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string) {
    const role = await this.roleModel.findById(id).exec();
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.roleModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async remove(id: string) {
    const role = await this.roleModel.findByIdAndDelete(id).exec();
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return { deleted: true };
  }
}