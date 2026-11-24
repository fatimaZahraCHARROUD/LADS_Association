import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { Meeting } from './entities/meeting.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { WriterRoleGuard } from '../services/jwt/writer-role.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, Department, User]),
    JwtModule,
    UsersModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService, JwtAuthGuard, WriterRoleGuard],
  exports: [MeetingsService],
})
export class MeetingsModule {}
