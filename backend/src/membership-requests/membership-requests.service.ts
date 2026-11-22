import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipRequest } from './entities/membership-request.entity';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class MembershipRequestsService {
  constructor(
    @InjectRepository(MembershipRequest)
    private membershipRepo: Repository<MembershipRequest>,
    private mailService: MailService,
  ) {}

  async create(dto: CreateMembershipRequestDto) {
    const request = this.membershipRepo.create(dto as Partial<MembershipRequest>);
    const saved = await this.membershipRepo.save(request);

    setImmediate(async () => {
      try {
        await this.mailService.sendMembershipRequestEmail(dto);
        console.log(`✅ Membership request email sent for ${dto.fullName}`);
      } catch (error) {
        console.error(`❌ Failed to send membership request email for ${dto.fullName}:`, error);
      }
    });

    return saved;
  }

  findAll() {
    return this.membershipRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const req = await this.membershipRepo.findOne({ where: { id: Number(id) } });
    if (!req) throw new NotFoundException(`Membership request ${id} not found`);
    return req;
  }

  async remove(id: string) {
    const req = await this.membershipRepo.findOne({ where: { id: Number(id) } });
    if (!req) throw new NotFoundException(`Membership request ${id} not found`);
    await this.membershipRepo.remove(req);
    return { deleted: true };
  }

  async markAsRead(id: string) {
    const req = await this.membershipRepo.findOne({ where: { id: Number(id) } });
    if (!req) throw new NotFoundException(`Membership request ${id} not found`);
    if (req.readAt) return req;
    req.readAt = new Date();
    return this.membershipRepo.save(req);
  }
}
