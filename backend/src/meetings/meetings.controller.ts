import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { WriterRoleGuard } from '../services/jwt/writer-role.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard'; // Added missing import
import { getUserId } from '../services/jwt/current-user';

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @UseGuards(WriterRoleGuard) // Removed redundant JwtAuthGuard (already on class)
  @Post()
  create(@Body() dto: CreateMeetingDto, @Req() req: any) {
    return this.meetingsService.create(dto, getUserId(req));
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    // Removed duplicate @Req() declaration
    return this.meetingsService.findAll(getUserId(req), from, to);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.meetingsService.findOne(id, getUserId(req));
  }

  @UseGuards(WriterRoleGuard) // Removed redundant JwtAuthGuard
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
    @Req() req: any,
  ) {
    return this.meetingsService.update(id, dto, getUserId(req));
  }

  @UseGuards(WriterRoleGuard) // Removed redundant JwtAuthGuard
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.meetingsService.remove(id, getUserId(req));
  }
}