import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  create(dto: CreateEventDto) {
    return this.eventModel.create(dto);
  }

  findAll(status?: string, isPublished?: boolean) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (isPublished !== undefined) filter.isPublished = isPublished;
    return this.eventModel.find(filter).sort({ date: -1 }).exec();
  }

  async findOne(id: string) {
    const event = await this.eventModel.findById(id).exec();
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.eventModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async remove(id: string) {
    const event = await this.eventModel.findByIdAndDelete(id).exec();
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return { deleted: true };
  }

  async togglePublish(id: string) {
    const event = await this.eventModel.findById(id).exec();
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    event.isPublished = !event.isPublished;
    return event.save();
  }
}