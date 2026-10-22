import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MembershipRequest, MembershipRequestDocument } from './schemas/membership-request.schema';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class MembershipRequestsService {
  constructor(
    @InjectModel(MembershipRequest.name) private membershipModel: Model<MembershipRequestDocument>,
         private mailService:MailService
    
  ) {}

 async create(dto: CreateMembershipRequestDto) {

  // 1. Save in DB
  const request = await this.membershipModel.create(dto);

  // 2. Send email in background
  setImmediate(async () => {
    try {

      await this.mailService.sendMembershipRequestEmail(dto);

      console.log(
        `✅ Membership request email sent for ${dto.fullName}`
      );

    } catch (error) {

      console.error(
        `❌ Failed to send membership request email for ${dto.fullName}:`,
        error,
      );

    }
  });

  // 3. Return immediately
  return request;
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
