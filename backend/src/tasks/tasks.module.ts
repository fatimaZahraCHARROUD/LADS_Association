import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Objective } from '../objectives/entities/objective.entity';
import { Department } from '../departments/entities/department.entity';
import { JwtModule } from '../services/jwt/jwt.modul';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Objective, Department]),
    JwtModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, JwtAuthGuard, ActiveRoleGuard],
})
export class TasksModule {}
