import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { Meeting, MeetingSchema } from './schemas/meeting.schema';
import { Department, DepartmentSchema } from '../departments/schemas/department.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { WriterRoleGuard } from '../services/jwt/writer-role.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { UsersModule } from '../users/users.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meeting.name, schema: MeetingSchema },
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    JwtModule,
    UsersModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService, JwtAuthGuard, WriterRoleGuard],
  exports: [MeetingsService],
})
export class MeetingsModule {}
