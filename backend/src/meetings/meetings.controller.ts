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
    @Req() req?: any,
  ) {
    const userId = req ? getUserId(req) : undefined;
    return this.meetingsService.findAll(from, to, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req?: any) {
    const userId = req ? getUserId(req) : undefined;
    return this.meetingsService.findOne(id, userId);
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
    @Req() req: any,
  ) {
    return this.meetingsService.update(id, dto, getUserId(req));
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.meetingsService.remove(id, getUserId(req));
  }
}