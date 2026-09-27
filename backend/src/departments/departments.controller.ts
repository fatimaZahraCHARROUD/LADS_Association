import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import {
  AssignDepartmentUserDto,
  AssignDepartmentUsersDto,
} from './dto/assign-department-users.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsAdminGuard } from './departments-admin.guard';
import { DepartmentsService } from './departments.service';

@UseGuards(JwtAuthGuard, DepartmentsAdminGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Patch(':id/manager')
  assignManager(@Param('id') id: string, @Body() dto: AssignDepartmentUserDto) {
    return this.departmentsService.assignManager(id, dto.userId);
  }

  @Patch(':id/vice-manager')
  assignViceManager(
    @Param('id') id: string,
    @Body() dto: AssignDepartmentUserDto,
  ) {
    return this.departmentsService.assignViceManager(id, dto.userId);
  }

  @Patch(':id/team-managers')
  assignTeamManagers(
    @Param('id') id: string,
    @Body() dto: AssignDepartmentUsersDto,
  ) {
    return this.departmentsService.assignTeamManagers(id, dto.userIds);
  }

  @Patch(':id/members')
  assignMembers(
    @Param('id') id: string,
    @Body() dto: AssignDepartmentUsersDto,
  ) {
    return this.departmentsService.assignMembers(id, dto.userIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
