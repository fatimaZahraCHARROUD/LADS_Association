import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { News, NewsDocument } from './schemas/news.schema';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class NewsService {
  constructor(@InjectModel(News.name) private newsModel: Model<NewsDocument>,    private uploadService: UploadService,) {}

  create(dto: CreateNewsDto) {
    return this.newsModel.create(dto);
  }

  findAll(isPublished?: boolean, tag?: string) {
    const filter: Record<string, unknown> = {};
    if (isPublished !== undefined) filter.isPublished = isPublished;
    if (tag) filter.tags = tag;
    return this.newsModel.find(filter).sort({ publishedAt: -1 }).exec();
  }

  async findOne(id: string) {
    const news = await this.newsModel.findById(id).exec();
    if (!news) throw new NotFoundException(`News ${id} not found`);
    return news;
  }

  async update(id: string, dto: UpdateNewsDto) {
  const existing = await this.newsModel.findById(id).exec();

  if (!existing) {
    throw new NotFoundException(`News ${id} not found`);
  }

  // ✅ delete old image if replaced
  if (
    dto.thumbnail &&
    existing.thumbnail &&
    dto.thumbnail !== existing.thumbnail
  ) {
    if (existing.coverImagePublicId) {
      await this.uploadService.deleteImage(
        existing.coverImagePublicId,
      );
    }
  }

  const updated = await this.newsModel
    .findByIdAndUpdate(id, dto, { new: true })
    .exec();

  return updated;
}

  async remove(id: string) {
  const existing = await this.newsModel.findById(id).exec();

  if (!existing) {
    throw new NotFoundException(`News ${id} not found`);
  }

  // ✅ delete Cloudinary image
  if (existing.coverImagePublicId) {
    await this.uploadService.deleteImage(
      existing.coverImagePublicId,
    );
  }

  await this.newsModel.findByIdAndDelete(id).exec();

  return {
    message: 'News deleted',
  };
}

  async togglePublish(id: string) {
    const news = await this.newsModel.findById(id).exec();
    if (!news) throw new NotFoundException(`News ${id} not found`);
    news.isPublished = !news.isPublished;
    if (!news.isPublished) news.publishedAt = new Date();
    return news.save();
  }
}
