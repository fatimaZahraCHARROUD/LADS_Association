import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CellulesService } from './cellules.service';
import { CreateCelluleDto } from './dto/create-cellule.dto';
import { UpdateCelluleDto } from './dto/update-cellule.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';

// Toutes les routes de ce controller exigent: 1) un token JWT valide
// 2) un rôle autorisé par le @Roles() de chaque route
@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('cellules')
export class CellulesController {
  constructor(private readonly cellulesService: CellulesService) {}

  // Voir les cellules (et filtrer par département) : Exec Dir, Team Manager, Responsable, President
  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Get()
  findAll(@Query('departmentId') departmentId?: string) {
    return this.cellulesService.findAll(departmentId);
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cellulesService.findOne(id);
  }

  // Créer une cellule : le Responsable (ou le Président)
  @Roles('President', 'Responsable')
  @Post()
  create(@Body() dto: CreateCelluleDto) {
    return this.cellulesService.create(dto);
  }

  @Roles('President', 'Responsable')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCelluleDto) {
    return this.cellulesService.update(id, dto);
  }

  @Roles('President', 'Responsable')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cellulesService.remove(id);
  }
}