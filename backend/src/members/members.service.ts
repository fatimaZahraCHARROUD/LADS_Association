import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

@Injectable()
export class MembersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateMemberDto, file?: Express.Multer.File) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const profileImage = file
      ? `/uploads/members/${file.filename}`
      : '';

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const membershipNumber = await this.generateMembershipNumber();

    const member = await this.userModel.create({
      ...dto,
      password: hashedPassword,
      profileImage,
      membershipNumber,
      date_adhesion:
        dto.date_adhesion ?? new Date().toISOString().slice(0, 10),
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

    return this.userModel.find(query).select('-password').sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const member = await this.userModel.findById(id).select('-password').exec();
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return member;
  }

  async update(id: string, dto: UpdateMemberDto, file?: Express.Multer.File) {
    const memberDoc = await this.userModel.findById(id).exec();
    if (!memberDoc) throw new NotFoundException(`Member ${id} not found`);

    const data: any = { ...dto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    if (file) {
      data.profileImage = `/uploads/members/${file.filename}`;
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