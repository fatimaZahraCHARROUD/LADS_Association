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

  @Get()
  findAll(@Req() req: any, @Query('status') status?: string) {
    return this.objectivesService.findAll(getUserId(req), status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.objectivesService.findOne(id, getUserId(req));
  }

  @Roles('President', 'Responsable')
  @Post()
  create(@Body() dto: CreateObjectiveDto, @Req() req: any) {
    return this.objectivesService.create(dto, getUserId(req));
  }

  @Roles('President', 'Responsable')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateObjectiveDto,
    @Req() req: any,
  ) {
    return this.objectivesService.update(id, dto, getUserId(req));
  }

  @Roles('President', 'Responsable')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.objectivesService.remove(id, getUserId(req));
  }
}