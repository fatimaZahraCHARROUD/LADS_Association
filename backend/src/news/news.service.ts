import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News) private newsRepo: Repository<News>,
    private uploadService: UploadService,
  ) {}

  create(dto: CreateNewsDto) {
    const news = this.newsRepo.create(dto as Partial<News>);
    return this.newsRepo.save(news);
  }

  findAll(isPublished?: boolean, tag?: string) {
    const where: Record<string, unknown> = {};
    if (isPublished !== undefined) where['isPublished'] = isPublished;
    return this.newsRepo.find({ where, order: { publishedAt: 'DESC' } });
  }

  async findOne(id: string) {
    const news = await this.newsRepo.findOne({ where: { id: Number(id) } });
    if (!news) throw new NotFoundException(`News ${id} not found`);
    return news;
  }

  async update(id: string, dto: UpdateNewsDto) {
    const existing = await this.newsRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`News ${id} not found`);

    if (dto.thumbnail && existing.thumbnail && dto.thumbnail !== existing.thumbnail) {
      if (existing.coverImagePublicId) {
        await this.uploadService.deleteImage(existing.coverImagePublicId);
      }
    }

    Object.assign(existing, dto);
    return this.newsRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.newsRepo.findOne({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`News ${id} not found`);

    if (existing.coverImagePublicId) {
      await this.uploadService.deleteImage(existing.coverImagePublicId);
    }

    await this.newsRepo.remove(existing);
    return { message: 'News deleted' };
  }

  async togglePublish(id: string) {
    const news = await this.newsRepo.findOne({ where: { id: Number(id) } });
    if (!news) throw new NotFoundException(`News ${id} not found`);
    news.isPublished = !news.isPublished;
    if (news.isPublished) news.publishedAt = new Date();
    return this.newsRepo.save(news);
  }
}
