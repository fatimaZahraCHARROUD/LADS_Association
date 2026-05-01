import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { News, NewsDocument } from './schemas/news.schema';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(@InjectModel(News.name) private newsModel: Model<NewsDocument>) {}

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
    const news = await this.newsModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!news) throw new NotFoundException(`News ${id} not found`);
    return news;
  }

  async remove(id: string) {
    const news = await this.newsModel.findByIdAndDelete(id).exec();
    if (!news) throw new NotFoundException(`News ${id} not found`);
    return { deleted: true };
  }

  async togglePublish(id: string) {
    const news = await this.newsModel.findById(id).exec();
    if (!news) throw new NotFoundException(`News ${id} not found`);
    news.isPublished = !news.isPublished;
    if (!news.isPublished) news.publishedAt = new Date();
    return news.save();
  }
}
