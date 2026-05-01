import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    const published = isPublished !== undefined ? isPublished === 'true' : undefined;
    return this.activitiesService.findAll(status, published);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activitiesService.update(id, dto);
  }

  @Patch(':id/publish')
  togglePublish(@Param('id') id: string) {
    return this.activitiesService.togglePublish(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
