import {
  Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { ProjectWorkService } from './project-work.service';
import {
  CreateCellDto, CreateTaskDto, UpdateCellDto, UpdateTaskDto, UpdateTaskStatusDto,
} from './dto/project-work.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { getUserId } from '../services/jwt/current-user';

@UseGuards(JwtAuthGuard)
@Controller('project-work')
export class ProjectWorkController {
  constructor(private readonly service: ProjectWorkService) {}

  private user(req: any) {
    return this.service.getAuthUser(getUserId(req));
  }

  @Get('my-projects')
  async myProjects(@Req() req: any) {
    return this.service.myProjects(await this.user(req));
  }

  @Get('my-tasks')
  async myTasks(@Req() req: any) {
    return this.service.myTasks(await this.user(req));
  }

  @Get('projects/:projectId/cells')
  async listCells(@Param('projectId') pid: string, @Req() req: any) {
    return this.service.listCells(pid, await this.user(req));
  }

  @Post('projects/:projectId/cells')
  async createCell(@Param('projectId') pid: string, @Body() dto: CreateCellDto, @Req() req: any) {
    return this.service.createCell(pid, dto, await this.user(req));
  }

  @Patch('cells/:id')
  async updateCell(@Param('id') id: string, @Body() dto: UpdateCellDto, @Req() req: any) {
    return this.service.updateCell(id, dto, await this.user(req));
  }

  @Delete('cells/:id')
  async removeCell(@Param('id') id: string, @Req() req: any) {
    return this.service.removeCell(id, await this.user(req));
  }

  @Get('projects/:projectId/tasks')
  async listTasks(@Param('projectId') pid: string, @Req() req: any) {
    return this.service.listTasks(pid, await this.user(req));
  }

  @Post('cells/:cellId/tasks')
  async createTask(@Param('cellId') cid: string, @Body() dto: CreateTaskDto, @Req() req: any) {
    return this.service.createTask(cid, dto, await this.user(req));
  }

  @Patch('tasks/:id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto, @Req() req: any) {
    return this.service.updateTaskStatus(id, dto.status, await this.user(req));
  }

  @Patch('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() req: any) {
    return this.service.updateTask(id, dto, await this.user(req));
  }

  @Delete('tasks/:id')
  async removeTask(@Param('id') id: string, @Req() req: any) {
    return this.service.removeTask(id, await this.user(req));
  }
}