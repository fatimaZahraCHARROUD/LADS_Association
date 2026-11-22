import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentMember } from './entities/department-member.entity';
import { CreateDepartmentMemberDto } from './dto/create-department-member.dto';

@Injectable()
export class DepartmentMembersService {
  constructor(
    @InjectRepository(DepartmentMember)
    private deptMemberRepo: Repository<DepartmentMember>,
  ) {}

  async create(dto: CreateDepartmentMemberDto) {
    const existing = await this.deptMemberRepo.findOne({
      where: { user: Number(dto.user), department: Number(dto.department) },
    });
    if (existing) {
      throw new BadRequestException('This member is already in this department');
    }
    const member = this.deptMemberRepo.create({
      user: Number(dto.user),
      department: Number(dto.department),
    } as Partial<DepartmentMember>);
    return this.deptMemberRepo.save(member);
  }

  findAll() {
    return this.deptMemberRepo.find();
  }

  findByDepartment(department: string) {
    return this.deptMemberRepo.find({ where: { department: Number(department) } });
  }

  async remove(id: string) {
    const item = await this.deptMemberRepo.findOne({ where: { id: Number(id) } });
    if (!item) throw new NotFoundException(`DepartmentMember ${id} not found`);
    await this.deptMemberRepo.remove(item);
    return { deleted: true };
  }
}
