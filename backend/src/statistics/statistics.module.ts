import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Department } from '../departments/entities/department.entity';
import { FollowupNote } from '../followups/entities/followup-note.entity';
import { Meeting } from '../meetings/entities/meeting.entity';
import { Objective } from '../objectives/entities/objective.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Department,
      User,
      Task,
      Meeting,
      Objective,
      Project,
      Activity,
      FollowupNote,
    ]),
    JwtModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService, JwtAuthGuard],
  exports: [StatisticsService],
})
export class StatisticsModule {}
