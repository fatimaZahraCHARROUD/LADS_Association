import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project, ProjectSchema } from './schemas/project.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PublicProjectsController } from './projects-public.controller';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema }, // requis par ActiveRoleGuard
    ]),
    JwtModule,
  ],
  controllers: [ProjectsController, PublicProjectsController],
  providers: [ProjectsService, JwtAuthGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}