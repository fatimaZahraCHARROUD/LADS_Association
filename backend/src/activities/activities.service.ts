import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(@InjectModel(Activity.name) private activityModel: Model<ActivityDocument>) {}

  create(dto: CreateActivityDto) {
    return this.activityModel.create(dto);
  }

  findAll(status?: string, isPublished?: boolean) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (isPublished !== undefined) filter.isPublished = isPublished;
    return this.activityModel.find(filter).sort({ activityDate: -1 }).exec();
  }

  async findOne(id: string) {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto) {
    const activity = await this.activityModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return activity;
  }

  async remove(id: string) {
    const activity = await this.activityModel.findByIdAndDelete(id).exec();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    return { deleted: true };
  }

  async togglePublish(id: string) {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    activity.isPublished = !activity.isPublished;
    return activity.save();
  }
}
