import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UploadService } from '../upload/upload.service';


@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private activityModel: Model<ActivityDocument>,

    private uploadService: UploadService,
  ) {}
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
  const existing = await this.activityModel.findById(id).exec();

  if (!existing) {
    throw new NotFoundException(`Activity ${id} not found`);
  }

  // ✅ delete old image if replaced
  if (
    dto.image &&
    existing.image &&
    dto.image !== existing.image
  ) {
    if (existing.coverImagePublicId) {
      await this.uploadService.deleteImage(
        existing.coverImagePublicId,
      );
    }
  }

  const updated = await this.activityModel
    .findByIdAndUpdate(id, dto, { new: true })
    .exec();

  return updated;
}

 async remove(id: string) {
  const existing = await this.activityModel.findById(id).exec();

  if (!existing) {
    throw new NotFoundException(`Activity ${id} not found`);
  }

  // ✅ delete cloudinary image
  if (existing.coverImagePublicId) {
    await this.uploadService.deleteImage(
      existing.coverImagePublicId,
    );
  }

  await this.activityModel.findByIdAndDelete(id).exec();

  return {
    message: 'Activity deleted',
  };
}

  async togglePublish(id: string) {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    activity.isPublished = !activity.isPublished;
    return activity.save();
  }
}
