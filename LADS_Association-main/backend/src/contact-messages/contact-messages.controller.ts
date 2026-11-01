import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@Controller('contact-messages')
export class ContactMessagesController {
  constructor(private readonly contactMessagesService: ContactMessagesService) {}

  @Post()
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactMessagesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.contactMessagesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactMessagesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.contactMessagesService.markAsRead(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactMessagesService.remove(id);
  }
}
