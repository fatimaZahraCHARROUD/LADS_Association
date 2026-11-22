import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LadsInfoService } from './lads-info.service';
import { CreateLadsInfoDto } from './dto/create-lads-info.dto';
import { UpdateLadsInfoDto } from './dto/update-lads-info.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@Controller('lads-info')
export class LadsInfoController {
  constructor(private readonly ladsInfoService: LadsInfoService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateLadsInfoDto) {
    return this.ladsInfoService.create(dto);
  }

  @Get()
  findAll() {
    return this.ladsInfoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ladsInfoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLadsInfoDto) {
    return this.ladsInfoService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ladsInfoService.remove(id);
  }
}
