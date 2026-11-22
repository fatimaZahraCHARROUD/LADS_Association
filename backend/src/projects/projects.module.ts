import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { PublicProjectsController } from './projects-public.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, User]),
    JwtModule,
  ],
  controllers: [ProjectsController, PublicProjectsController],
  providers: [ProjectsService, JwtAuthGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
