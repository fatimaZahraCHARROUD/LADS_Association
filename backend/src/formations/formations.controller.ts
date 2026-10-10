import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards,
} from '@nestjs/common';
import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';

@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President', 'Director Executive')
  @Post()
  create(@Body() dto: CreateFormationDto) {
    return this.formationsService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    const published =
      isPublished !== undefined ? isPublished === 'true' : undefined;
    return this.formationsService.findAll(status, published);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President', 'Director Executive')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFormationDto) {
    return this.formationsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President', 'Director Executive')
  @Patch(':id/publish')
  togglePublish(@Param('id') id: string) {
    return this.formationsService.togglePublish(id);
  }

  @UseGuards(JwtAuthGuard, ActiveRoleGuard)
  @Roles('President', 'Director Executive')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formationsService.remove(id);
  }
}