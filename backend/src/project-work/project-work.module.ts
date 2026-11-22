import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ProjectCell, ProjectCellSchema } from './schemas/project-cell.schema';
import { ProjectTask, ProjectTaskSchema } from './schemas/project-task.schema';
import { ProjectWorkController } from './project-work.controller';
import { ProjectWorkService } from './project-work.service';
// même import que dans auth.module.ts (le fichier s'appelle bien jwt.modul)
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
      { name: ProjectCell.name, schema: ProjectCellSchema },
      { name: ProjectTask.name, schema: ProjectTaskSchema },
    ]),
  ],
  controllers: [ProjectWorkController],
  providers: [ProjectWorkService],
})
export class ProjectWorkModule {}