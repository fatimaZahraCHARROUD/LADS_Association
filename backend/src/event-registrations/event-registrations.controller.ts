import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { EventRegistrationsService } from './event-registrations.service';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';

@Controller('event-registrations')
export class EventRegistrationsController {
  constructor(private readonly eventRegistrationsService: EventRegistrationsService) {}

  @Post()
  create(@Body() dto: CreateEventRegistrationDto) {
    return this.eventRegistrationsService.create(dto);
  }

  @Get()
  findAll(@Query('eventId') eventId?: string) {
    return this.eventRegistrationsService.findAll(eventId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventRegistrationsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventRegistrationsService.remove(id);
  }
}
