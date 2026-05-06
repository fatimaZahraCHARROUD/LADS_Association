import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { MembershipRequestsService } from './membership-requests.service';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@Controller('membership-requests')
export class MembershipRequestsController {
  constructor(private readonly membershipRequestsService: MembershipRequestsService) {}

  @Post()
  create(@Body() dto: CreateMembershipRequestDto) {
    return this.membershipRequestsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.membershipRequestsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membershipRequestsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membershipRequestsService.remove(id);
  }
}
