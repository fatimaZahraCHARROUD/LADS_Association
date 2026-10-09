import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './schemas/task.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Objective,
  ObjectiveSchema,
} from '../objectives/schemas/objective.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { JwtModule } from '../services/jwt/jwt.modul';        // 👈 new
import { JwtAuthGuard } from '../services/jwt/jwt.guard';     // 👈 new

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Objective.name, schema: ObjectiveSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    JwtModule,                                                 // 👈 new
  ],
  controllers: [TasksController],
  providers: [TasksService, JwtAuthGuard],                    // 👈 add guard
})
export class TasksModule {}