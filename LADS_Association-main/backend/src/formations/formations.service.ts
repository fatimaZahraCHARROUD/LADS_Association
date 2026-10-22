import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Formation, FormationDocument } from './schemas/formation.schema';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class FormationsService {
  constructor(
    @InjectModel(Formation.name)
    private formationModel: Model<FormationDocument>,
        private uploadService: UploadService,

  ) {}

  create(dto: CreateFormationDto) {
    return this.formationModel.create(dto);
  }

  findAll(status?: string, isPublished?: boolean) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (isPublished !== undefined) filter.isPublished = isPublished;
    return this.formationModel.find(filter).sort({ date: -1 }).exec();
  }

  async findOne(id: string) {
    const formation = await this.formationModel.findById(id).exec();
    if (!formation) throw new NotFoundException(`Formation ${id} not found`);
    return formation;
  }

  async update(id: string, dto: UpdateFormationDto) {
  const existing = await this.formationModel.findById(id).exec();

  if (!existing) {
    throw new NotFoundException(`Formation ${id} not found`);
  }

  // ✅ delete old image if replaced
  if (
    dto.imgUrl &&
    existing.imgUrl &&
    dto.imgUrl !== existing.imgUrl
  ) {
    if (existing.coverImagePublicId) {
      await this.uploadService.deleteImage(
        existing.coverImagePublicId,
      );
    }
  }

  const updated = await this.formationModel
    .findByIdAndUpdate(id, dto, { new: true })
    .exec();

  return updated;
}

  async remove(id: string) {
  const existing = await this.formationModel.findById(id).exec();

  if (!existing) {
    throw new NotFoundException(`Formation ${id} not found`);
  }

  // ✅ delete image from Cloudinary
  if (existing.coverImagePublicId) {
    await this.uploadService.deleteImage(
      existing.coverImagePublicId,
    );
  }

  await this.formationModel.findByIdAndDelete(id).exec();

  return {
    message: 'Formation deleted',
  };
}

  async togglePublish(id: string) {
    const formation = await this.formationModel.findById(id).exec();
    if (!formation) throw new NotFoundException(`Formation ${id} not found`);
    formation.isPublished = !formation.isPublished;
    return formation.save();
  }
}
