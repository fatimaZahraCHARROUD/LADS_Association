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
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';
import { getUserId } from '../services/jwt/current-user';

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Post()
  create(@Body() dto: CreateMeetingDto, @Req() req: any) {
    return this.meetingsService.create(dto, getUserId(req));
  }

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.meetingsService.findAll(from, to);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetingsService.update(id, dto);
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingsService.remove(id);
  }
}