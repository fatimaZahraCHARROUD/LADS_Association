import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactMessage, ContactMessageDocument } from './schemas/contact-message.schema';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ContactMessagesService {
  constructor(
    @InjectModel(ContactMessage.name) private contactModel: Model<ContactMessageDocument>,
     private mailService:MailService
  ) {}

 async create(dto: CreateContactMessageDto) {

  // 1. Save message in MongoDB
  const message = await this.contactModel.create(dto);

  // 2. Return immediately, send email in background
  setImmediate(async () => {
    try {
      await this.mailService.sendContactEmail(dto);
      console.log(
        `✅ Contact email sent to admin for ${dto.fullName}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to send contact email for ${dto.fullName}:`,
        error,
      );
    }
  });

  // 3. Return response immediately
  return message;
}


  findAll() {
    return this.contactModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const msg = await this.contactModel.findById(id).exec();
    if (!msg) throw new NotFoundException(`Contact message ${id} not found`);
    return msg;
  }

  async remove(id: string) {
    const msg = await this.contactModel.findByIdAndDelete(id).exec();
    if (!msg) throw new NotFoundException(`Contact message ${id} not found`);
    return { deleted: true };
  }

  async markAsRead(id: string) {
    const msg = await this.contactModel.findById(id).exec();
    if (!msg) throw new NotFoundException(`Contact message ${id} not found`);
    if (msg.readAt) return msg;
    msg.readAt = new Date();
    return msg.save();
  }
}
