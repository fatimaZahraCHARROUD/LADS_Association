import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  EventRegistration,
  EventRegistrationDocument
} from './schemas/event-registration.schema';

import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { MailService } from '../mail/mail.service';
import { Event } from '../events/schemas/event.schema';


type PopulatedEventRegistration = Omit<EventRegistration, 'eventId'> & {
  eventId: Event;
};


@Injectable()
export class EventRegistrationsService {

  constructor(
    @InjectModel(EventRegistration.name)
    private registrationModel: Model<EventRegistrationDocument>,

    private mailService: MailService
  ) {}

 async create(dto: CreateEventRegistrationDto) {

  // 1. Save registration
  const registration = await this.registrationModel.create(dto);

  // 2. Populate event information
  const populatedRegistration =
    await this.registrationModel
      .findById(registration._id)
      .populate("eventId", "title date")
      .exec() as PopulatedEventRegistration | null;

  if (!populatedRegistration) {
    throw new NotFoundException("Registration not found");
  }

  // 3. Send email in background
  setImmediate(async () => {
    try {
      await this.mailService.sendEventRegistrationEmail({

        fullName: populatedRegistration.fullName,

        email: populatedRegistration.email,

        phone: populatedRegistration.phone,

        // Localized event title
        eventTitle: populatedRegistration.eventId.title.fr,

        eventDate: populatedRegistration.eventId.date,

      });

      console.log(
        `✅ Event registration email sent for ${populatedRegistration.fullName}`
      );

    } catch (error) {

      console.error(
        `❌ Failed to send event registration email for ${populatedRegistration.fullName}:`,
        error,
      );

    }
  });

  // 4. Return immediately
  return registration;
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

  async markAsRead(id: string) {
    const reg = await this.registrationModel.findById(id).exec();
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);
    if (reg.readAt) return reg;
    reg.readAt = new Date();
    return reg.save();
  }
}
