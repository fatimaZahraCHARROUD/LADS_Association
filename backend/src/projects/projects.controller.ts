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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import { Roles } from '../services/jwt/roles.decorator';
import { getUserId } from '../services/jwt/current-user';

const READERS = ['President', 'Director Executive', 'Team Manager', 'Responsable'];

@UseGuards(JwtAuthGuard, ActiveRoleGuard)
@Roles('President')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @Req() req: any) {
    return this.projectsService.create(dto, getUserId(req));
  }

  @Roles(...READERS)
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.projectsService.findAll({ status, departmentId });
  }

  @Roles(...READERS)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id/status')
  updateProgress(
    @Param('id') id: string,
    @Body() body: { status?: string; progress?: number },
  ) {
    return this.projectsService.updateProgress(id, body);
  }
    @Patch(':id/publish')
  togglePublish(@Param('id') id: string) {
    return this.projectsService.togglePublish(id);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}