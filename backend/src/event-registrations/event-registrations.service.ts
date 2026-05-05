import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventRegistration, EventRegistrationDocument } from './schemas/event-registration.schema';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';

@Injectable()
export class EventRegistrationsService {
  constructor(
    @InjectModel(EventRegistration.name) private registrationModel: Model<EventRegistrationDocument>,
  ) {}

  create(dto: CreateEventRegistrationDto) {
    return this.registrationModel.create(dto);
  }

  findAll(eventId?: string) {
    const filter: Record<string, unknown> = {};
    if (eventId) filter.eventId = eventId;
    return this.registrationModel
      .find(filter)
      .populate('eventId', 'title date')
      .sort({ registrationDate: -1 })
      .exec();
  }

  async findOne(id: string) {
    const reg = await this.registrationModel.findById(id).populate('eventId', 'title date').exec();
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);
    return reg;
  }

  async remove(id: string) {
    const reg = await this.registrationModel.findByIdAndDelete(id).exec();
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);
    return { deleted: true };
  }
}
