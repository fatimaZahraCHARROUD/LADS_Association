import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DepartmentMembersService } from './department-members.service';
import { CreateDepartmentMemberDto } from './dto/create-department-member.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('department-members')
export class DepartmentMembersController {
  constructor(
    private readonly departmentMembersService: DepartmentMembersService,
  ) {}

  @Post()
  create(@Body() dto: CreateDepartmentMemberDto) {
    return this.departmentMembersService.create(dto);
  }

  @Get()
  findAll() {
    return this.departmentMembersService.findAll();
  }

  @Get('by-department')
  byDepartment(@Query('department') department: string) {
    return this.departmentMembersService.findByDepartment(department);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentMembersService.remove(id);
  }
}