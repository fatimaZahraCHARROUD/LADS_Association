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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';
import { getUserId } from '../services/jwt/current-user';

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Voir les tâches : tous les rôles connectés (le Member voit aussi celles des autres, en gris)
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('priority') priority?: string,
  ) {
    return this.tasksService.findAll(status, assignedTo, priority);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // Assigner / gérer les tâches : managers et Responsable
  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  // Avancer le statut d'une tâche : tout le monde, MAIS le Member ne peut
  // changer que SES tâches (vérifié dans le service)
  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable', 'Member')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: any,
  ) {
    return this.tasksService.updateStatus(id, dto.status, getUserId(req));
  }

  @Roles('President', 'Director Executive', 'Team Manager', 'Responsable')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}