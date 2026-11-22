import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateNewsDto) {
    return this.newsService.create(dto);
  }

  @Get()
  findAll(
    @Query('isPublished') isPublished?: string,
    @Query('tag') tag?: string,
  ) {
    const published = isPublished !== undefined ? isPublished === 'true' : undefined;
    return this.newsService.findAll(published, tag);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.newsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/publish')
  togglePublish(@Param('id') id: string) {
    return this.newsService.togglePublish(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
