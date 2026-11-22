import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRegistration } from './entities/event-registration.entity';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EventRegistrationsService {
  constructor(
    @InjectRepository(EventRegistration)
    private registrationRepo: Repository<EventRegistration>,
    private mailService: MailService,
  ) {}

  async create(dto: CreateEventRegistrationDto) {
    const registration = this.registrationRepo.create(dto as Partial<EventRegistration>);
    const saved = await this.registrationRepo.save(registration);

    setImmediate(async () => {
      try {
        await this.mailService.sendEventRegistrationEmail({
          fullName: saved.fullName,
          email: saved.email,
          phone: saved.phone,
          eventTitle: String(saved.eventId),
          eventDate: new Date(),
        });
        console.log(`✅ Event registration email sent for ${saved.fullName}`);
      } catch (error) {
        console.error(`❌ Failed to send event registration email for ${saved.fullName}:`, error);
      }
    });

    return saved;
  }

  findAll(eventId?: string) {
    const where: Record<string, unknown> = {};
    if (eventId) where['eventId'] = Number(eventId);
    return this.registrationRepo.find({ where, order: { registrationDate: 'DESC' } });
  }

  async findOne(id: string) {
    const reg = await this.registrationRepo.findOne({ where: { id: Number(id) } });
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);
    return reg;
  }

  async remove(id: string) {
    const reg = await this.registrationRepo.findOne({ where: { id: Number(id) } });
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);
    await this.registrationRepo.remove(reg);
    return { deleted: true };
  }

  async markAsRead(id: string) {
    const reg = await this.registrationRepo.findOne({ where: { id: Number(id) } });
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);
    if (reg.readAt) return reg;
    reg.readAt = new Date();
    return this.registrationRepo.save(reg);
  }
}
