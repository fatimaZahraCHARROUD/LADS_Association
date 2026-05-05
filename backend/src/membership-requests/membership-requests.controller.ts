import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { MembershipRequestsService } from './membership-requests.service';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';

@Controller('membership-requests')
export class MembershipRequestsController {
  constructor(private readonly membershipRequestsService: MembershipRequestsService) {}

  @Post()
  create(@Body() dto: CreateMembershipRequestDto) {
    return this.membershipRequestsService.create(dto);
  }

  @Get()
  findAll() {
    return this.membershipRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membershipRequestsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membershipRequestsService.remove(id);
  }
}
