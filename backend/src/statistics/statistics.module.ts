import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Activity,
  ActivitySchema,
} from '../activities/schemas/activity.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import {
  FollowupNote,
  FollowupNoteSchema,
} from '../followups/schemas/followup-note.schema';
import { Meeting, MeetingSchema } from '../meetings/schemas/meeting.schema';
import {
  Objective,
  ObjectiveSchema,
} from '../objectives/schemas/objective.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Meeting.name, schema: MeetingSchema },
      { name: Objective.name, schema: ObjectiveSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: FollowupNote.name, schema: FollowupNoteSchema },
    ]),
    JwtModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService, JwtAuthGuard],
  exports: [StatisticsService],
})
export class StatisticsModule {}
