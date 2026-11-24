import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';
import { getUserId } from '../services/jwt/current-user';
import { CreateFollowupNoteDto } from './dto/create-followup-note.dto';
import { UpdateFollowupNoteDto } from './dto/update-followup-note.dto';
import { FollowupsService } from './followups.service';

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('followups')
export class FollowupsController {
  constructor(private readonly followupsService: FollowupsService) {}

  @Roles('President', 'Director Executive', 'Team Manager')
  @Get()
  findAll(
    @Req() req: any,
    @Query('departmentId') departmentId?: string,
    @Query('memberId') memberId?: string,
    @Query('authorId') authorId?: string,
    @Query('noteType') noteType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.followupsService.findAll(getUserId(req), {
      departmentId,
      memberId,
      authorId,
      noteType,
      from,
      to,
    });
  }

  @Roles('President', 'Director Executive', 'Team Manager')
  @Post()
  create(@Req() req: any, @Body() dto: CreateFollowupNoteDto) {
    return this.followupsService.create(getUserId(req), dto);
  }

  @Roles('President', 'Director Executive', 'Team Manager')
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateFollowupNoteDto,
  ) {
    return this.followupsService.update(getUserId(req), id, dto);
  }

  @Roles('President', 'Director Executive', 'Team Manager')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.followupsService.remove(getUserId(req), id);
  }
}
