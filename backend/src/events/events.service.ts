import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    private uploadService: UploadService,
  ) {}

  create(dto: CreateEventDto) {
    const event = this.eventRepo.create(dto as Partial<Event>);
    return this.eventRepo.save(event);
  }

  findAll(status?: string, isPublished?: boolean) {
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (isPublished !== undefined) where['isPublished'] = isPublished;
    return this.eventRepo.find({ where, order: { date: 'DESC' } });
  }

  async findOne(id: string) {
    const event = await this.eventRepo.findOne({ where: { id: Number(id) } });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    const existing = await this.eventRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Event ${id} not found`);

    if (dto.coverImage && existing.coverImage && dto.coverImage !== existing.coverImage) {
      if (existing.coverImagePublicId) {
        await this.uploadService.deleteImage(existing.coverImagePublicId);
      }
    }

    Object.assign(existing, dto);
    return this.eventRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.eventRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Event ${id} not found`);

    if (existing.coverImagePublicId) {
      await this.uploadService.deleteImage(existing.coverImagePublicId);
    }

    await this.eventRepo.remove(existing);
    return { message: 'Event deleted' };
  }

  async togglePublish(id: string) {
    const event = await this.eventRepo.findOne({ where: { id: Number(id) } });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    event.isPublished = !event.isPublished;
    return this.eventRepo.save(event);
  }
}
