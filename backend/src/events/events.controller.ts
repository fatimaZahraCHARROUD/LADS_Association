import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President', 'Director Executive')
  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    const published = isPublished !== undefined ? isPublished === 'true' : undefined;
    return this.eventsService.findAll(status, published);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President', 'Director Executive')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President', 'Director Executive')
  @Patch(':id/publish')
  togglePublish(@Param('id') id: string) {
    return this.eventsService.togglePublish(id);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President', 'Director Executive')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}