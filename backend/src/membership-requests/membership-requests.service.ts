import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MembershipRequest, MembershipRequestDocument } from './schemas/membership-request.schema';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';

@Injectable()
export class MembershipRequestsService {
  constructor(
    @InjectModel(MembershipRequest.name) private membershipModel: Model<MembershipRequestDocument>,
  ) {}

  create(dto: CreateMembershipRequestDto) {
    return this.membershipModel.create(dto);
  }

  findAll() {
    return this.membershipModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const req = await this.membershipModel.findById(id).exec();
    if (!req) throw new NotFoundException(`Membership request ${id} not found`);
    return req;
  }

  async remove(id: string) {
    const req = await this.membershipModel.findByIdAndDelete(id).exec();
    if (!req) throw new NotFoundException(`Membership request ${id} not found`);
    return { deleted: true };
  }

  async markAsRead(id: string) {
    const req = await this.membershipModel.findById(id).exec();
    if (!req) throw new NotFoundException(`Membership request ${id} not found`);
    if (req.readAt) return req;
    req.readAt = new Date();
    return req.save();
  }
}
