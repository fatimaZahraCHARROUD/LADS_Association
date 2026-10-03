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
import { ObjectivesService } from './objectives.service';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';
import { getUserId } from '../services/jwt/current-user';

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('objectives')
export class ObjectivesController {
  constructor(private readonly objectivesService: ObjectivesService) {}

  // Voir les objectifs : tout le monde (tous les rôles connectés)
  @Get()
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.objectivesService.findAll(departmentId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.objectivesService.findOne(id);
  }

  // Créer / modifier / supprimer un objectif : le Responsable (ou le Président)
  @Roles('President', 'Responsable')
  @Post()
  create(@Body() dto: CreateObjectiveDto, @Req() req: any) {
    return this.objectivesService.create(dto, getUserId(req));
  }

  @Roles('President', 'Responsable')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateObjectiveDto) {
    return this.objectivesService.update(id, dto);
  }

  @Roles('President', 'Responsable')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.objectivesService.remove(id);
  }
}