import { Controller, Get } from '@nestjs/common';
import { ProjectsService } from './projects.service';

// No guard here: this route is read by visitors of the public website.
@Controller('public/projects')
export class PublicProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findPublished() {
    return this.projectsService.findPublished();
  }
}