import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meeting, MeetingDocument } from './schemas/meeting.schema';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name)
    private meetingModel: Model<MeetingDocument>,
  ) {}

  async create(dto: CreateMeetingDto, userId: string) {
    return this.meetingModel.create({ ...dto, createdBy: userId });
  }

  findAll(from?: string, to?: string) {
    const filter: Record<string, unknown> = {};
    if (from || to) {
      filter.startAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    }
    return this.meetingModel
      .find(filter)
      .sort({ startAt: 1 })
      .populate('createdBy', 'fullName email')
      .populate('participants', 'fullName email')
      .exec();
  }

  async findOne(id: string) {
    const meeting = await this.meetingModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('participants', 'fullName email')
      .exec();
    if (!meeting) throw new NotFoundException(`Meeting ${id} not found`);
    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto) {
    const existing = await this.meetingModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);
    const safe: Record<string, unknown> = { ...dto };
    delete safe.createdBy;
    return this.meetingModel.findByIdAndUpdate(id, safe, { new: true }).exec();
  }

  async remove(id: string) {
    const existing = await this.meetingModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Meeting ${id} not found`);
    await this.meetingModel.findByIdAndDelete(id).exec();
    return { message: 'Meeting deleted' };
  }
}