import {
  Controller, Get, Post, Body, Param, Patch, Delete, UseGuards,
} from '@nestjs/common';
import { MembershipRequestsService } from './membership-requests.service';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';

@Controller('membership-requests')
export class MembershipRequestsController {
  constructor(private readonly membershipRequestsService: MembershipRequestsService) {}

  @Post()
  create(@Body() dto: CreateMembershipRequestDto) {
    return this.membershipRequestsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President')
  @Get()
  findAll() {
    return this.membershipRequestsService.findAll();
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membershipRequestsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President')
  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.membershipRequestsService.markAsRead(id);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membershipRequestsService.remove(id);
  }
}