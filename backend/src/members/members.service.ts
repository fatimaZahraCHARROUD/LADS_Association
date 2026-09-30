import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

export interface MemberFilter {
  nom?: string;
  ville?: string;
  status?: string;
  departement?: string;
}

const GLOBAL_ROLES = ['President', 'Director Executive'];

@Injectable()
export class MembersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateMemberDto, file?: Express.Multer.File) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new BadRequestException('Email already exists');

    const profileImage = file ? `/uploads/members/${file.filename}` : '';
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const membershipNumber = await this.generateMembershipNumber();

    const role = dto.role || 'Member';
    const isGlobal = GLOBAL_ROLES.includes(role);

    const memberships = [
      {
        _id: new Types.ObjectId(),
        departmentId: isGlobal ? null : (dto.departement?.[0] || null),
        role,
      },
    ];

    // Remove `role` from spread so it doesn't overwrite the array field
    const { role: _ignoredRole, ...rest } = dto as any;

    const member = await this.userModel.create({
      ...rest,
      password: hashedPassword,
      profileImage,
      membershipNumber,
      date_adhesion:
        dto.date_adhesion ?? new Date().toISOString().slice(0, 10),
      memberships,
      activeMembershipId: memberships[0]._id,
      // keep legacy fields in sync
      role: [role],
      departement: isGlobal ? [] : (dto.departement || []),
      isAdmin: role === 'President',
    });

    const obj: any = member.toObject();
    delete obj.password;
    return obj;
  }

  private async generateMembershipNumber(): Promise<string> {
    const count = await this.userModel.countDocuments({
      membershipNumber: /^MEM-/,
    });
    let number = count + 1;
    let candidate = `MEM-${String(number).padStart(4, '0')}`;

    while (await this.userModel.findOne({ membershipNumber: candidate })) {
      number += 1;
      candidate = `MEM-${String(number).padStart(4, '0')}`;
    }

    return candidate;
  }

  findAll(filter: MemberFilter = {}) {
    const query: any = { isAdmin: { $ne: true } };

    if (filter.nom) {
      query.fullName = { $regex: filter.nom, $options: 'i' };
    }
    if (filter.ville) {
      query.ville = { $regex: filter.ville, $options: 'i' };
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.departement) {
      query.departement = filter.departement;
    }

    return this.userModel
      .find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const member = await this.userModel.findById(id).select('-password').exec();
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return member;
  }

  async update(id: string, dto: UpdateMemberDto, file?: Express.Multer.File) {
    const memberDoc = await this.userModel.findById(id).exec();
    if (!memberDoc) throw new NotFoundException(`Member ${id} not found`);

    // Strip `role` from the payload — we never want to write it directly
    const { role: newRole, ...rest } = dto as any;
    const data: any = { ...rest };

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    if (file) {
      data.profileImage = `/uploads/members/${file.filename}`;
    }

    // If a role was sent, rebuild memberships
    if (newRole) {
      const isGlobal = GLOBAL_ROLES.includes(newRole);
      const memberships = [
        {
          _id: new Types.ObjectId(),
          departmentId: isGlobal ? null : (rest.departement?.[0] || null),
          role: newRole,
        },
      ];
      data.memberships = memberships;
      data.activeMembershipId = memberships[0]._id;
      data.role = [newRole];
      data.departement = isGlobal ? [] : (rest.departement || []);
      data.isAdmin = newRole === 'President';
    }

    const member = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password')
      .exec();
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return member;
  }

  async remove(id: string) {
    const member = await this.userModel.findByIdAndDelete(id).exec();
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return { deleted: true };
  }
}