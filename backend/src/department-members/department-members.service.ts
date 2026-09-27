import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DepartmentMember,
  DepartmentMemberDocument,
} from './schemas/department-member.schema';
import { CreateDepartmentMemberDto } from './dto/create-department-member.dto';

@Injectable()
export class DepartmentMembersService {
  constructor(
    @InjectModel(DepartmentMember.name)
    private deptMemberModel: Model<DepartmentMemberDocument>,
  ) {}

  async create(dto: CreateDepartmentMemberDto) {
    const existing = await this.deptMemberModel.findOne({
      user: dto.user,
      department: dto.department,
    });
    if (existing) {
      throw new BadRequestException(
        'This member is already in this department',
      );
    }

    return this.deptMemberModel.create(dto);
  }

  findAll() {
    return this.deptMemberModel
      .find()
      .populate('user', 'fullName email profileImage status')
      .populate('department', 'name')
      .exec();
  }

  findByDepartment(department: string) {
    return this.deptMemberModel
      .find({ department })
      .populate('user', 'fullName email profileImage status')
      .exec();
  }

  async remove(id: string) {
    const item = await this.deptMemberModel.findByIdAndDelete(id).exec();
    if (!item) throw new NotFoundException(`DepartmentMember ${id} not found`);
    return { deleted: true };
  }
}