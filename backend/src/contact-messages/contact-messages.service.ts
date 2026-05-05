import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactMessage, ContactMessageDocument } from './schemas/contact-message.schema';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactMessagesService {
  constructor(
    @InjectModel(ContactMessage.name) private contactModel: Model<ContactMessageDocument>,
  ) {}

  create(dto: CreateContactMessageDto) {
    return this.contactModel.create(dto);
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
}
