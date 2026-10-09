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
import { CellulesService } from './cellules.service';
import { CreateCelluleDto } from './dto/create-cellule.dto';
import { UpdateCelluleDto } from './dto/update-cellule.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';
import { getUserId } from '../services/jwt/current-user';

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('cellules')
export class CellulesController {
  constructor(private readonly cellulesService: CellulesService) {}

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Get()
  findAll(@Req() req: any, @Query('departmentId') departmentId?: string) {
    return this.cellulesService.findAll(getUserId(req), departmentId);
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.cellulesService.findOne(id, getUserId(req));
  }

  @Roles('President', 'Responsable')
  @Post()
  create(@Body() dto: CreateCelluleDto, @Req() req: any) {
    return this.cellulesService.create(dto, getUserId(req));
  }

  @Roles('President', 'Responsable')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCelluleDto,
    @Req() req: any,
  ) {
    return this.cellulesService.update(id, dto, getUserId(req));
  }

  @Roles('President', 'Responsable')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.cellulesService.remove(id, getUserId(req));
  }
}