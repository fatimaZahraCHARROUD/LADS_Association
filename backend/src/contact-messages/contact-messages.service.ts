import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ContactMessagesService {
  constructor(
    @InjectRepository(ContactMessage)
    private contactRepo: Repository<ContactMessage>,
    private mailService: MailService,
  ) {}

  async create(dto: CreateContactMessageDto) {
    const message = this.contactRepo.create(dto as Partial<ContactMessage>);
    const saved = await this.contactRepo.save(message);

    setImmediate(async () => {
      try {
        await this.mailService.sendContactEmail(dto);
        console.log(`✅ Contact email sent to admin for ${dto.fullName}`);
      } catch (error) {
        console.error(`❌ Failed to send contact email for ${dto.fullName}:`, error);
      }
    });

    return saved;
  }

  findAll() {
    return this.contactRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const msg = await this.contactRepo.findOne({ where: { id: Number(id) } });
    if (!msg) throw new NotFoundException(`Contact message ${id} not found`);
    return msg;
  }

  async remove(id: string) {
    const msg = await this.contactRepo.findOne({ where: { id: Number(id) } });
    if (!msg) throw new NotFoundException(`Contact message ${id} not found`);
    await this.contactRepo.remove(msg);
    return { deleted: true };
  }

  async markAsRead(id: string) {
    const msg = await this.contactRepo.findOne({ where: { id: Number(id) } });
    if (!msg) throw new NotFoundException(`Contact message ${id} not found`);
    if (msg.readAt) return msg;
    msg.readAt = new Date();
    return this.contactRepo.save(msg);
  }
}
