import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

import { UploadService } from '../upload/upload.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,

    private uploadService: UploadService,
  ) {}

  async create(dto: CreateEventDto) {
    return this.eventModel.create(dto);
  }

  async findAll(status?: string, isPublished?: boolean) {
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (isPublished !== undefined) {
      filter.isPublished = isPublished;
    }

    return this.eventModel.find(filter).sort({ date: -1 }).exec();
  }

  async findOne(id: string) {
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    const existing = await this.eventModel.findById(id).exec();

    if (!existing) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    // ✅ delete old cloudinary image if changed
    if (
      dto.coverImage &&
      existing.coverImage &&
      dto.coverImage !== existing.coverImage
    ) {
      if (existing.coverImagePublicId) {
        await this.uploadService.deleteImage(
          existing.coverImagePublicId,
        );
      }
    }

    const updated = await this.eventModel
      .findByIdAndUpdate(id, dto, {
        new: true,
      })
      .exec();

    return updated;
  }

  async remove(id: string) {
    const existing = await this.eventModel.findById(id).exec();

    if (!existing) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    // ✅ delete cloudinary image
    if (existing.coverImagePublicId) {
      await this.uploadService.deleteImage(
        existing.coverImagePublicId,
      );
    }

    await this.eventModel.findByIdAndDelete(id).exec();

    return {
      message: 'Event deleted',
    };
  }

  async togglePublish(id: string) {
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    event.isPublished = !event.isPublished;

    return event.save();
  }
}