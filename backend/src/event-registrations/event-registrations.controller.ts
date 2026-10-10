import {
  Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards,
} from '@nestjs/common';
import { EventRegistrationsService } from './event-registrations.service';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';

@Controller('event-registrations')
export class EventRegistrationsController {
  constructor(private readonly eventRegistrationsService: EventRegistrationsService) {}

  @Post()
  create(@Body() dto: CreateEventRegistrationDto) {
    return this.eventRegistrationsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President')
  @Get()
  findAll(@Query('eventId') eventId?: string) {
    return this.eventRegistrationsService.findAll(eventId);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventRegistrationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President')
  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.eventRegistrationsService.markAsRead(id);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventRegistrationsService.remove(id);
  }
}