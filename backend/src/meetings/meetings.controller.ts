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
import { getUserId } from '../services/jwt/current-user';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @UseGuards(JwtAuthGuard, WriterRoleGuard)
  @Post()
  create(@Body() dto: CreateMeetingDto, @Req() req: any) {
    return this.meetingsService.create(dto, getUserId(req));
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.meetingsService.findAll(getUserId(req), from, to);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.meetingsService.findOne(id, getUserId(req));
  }

  @UseGuards(JwtAuthGuard, WriterRoleGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetingsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, WriterRoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingsService.remove(id);
  }
}
