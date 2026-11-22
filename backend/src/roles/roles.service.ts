import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(@InjectRepository(Role) private roleRepo: Repository<Role>) {}

  create(dto: CreateRoleDto) {
    const role = this.roleRepo.create(dto as Partial<Role>);
    return this.roleRepo.save(role);
  }

  findAll() {
    return this.roleRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const role = await this.roleRepo.findOne({ where: { id: Number(id) } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.roleRepo.findOne({ where: { id: Number(id) } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    Object.assign(role, dto);
    return this.roleRepo.save(role);
  }

  async remove(id: string) {
    const role = await this.roleRepo.findOne({ where: { id: Number(id) } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    await this.roleRepo.remove(role);
    return { deleted: true };
  }
}
