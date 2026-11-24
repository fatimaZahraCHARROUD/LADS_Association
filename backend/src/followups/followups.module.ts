import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { FollowupsController } from './followups.controller';
import { FollowupsService } from './followups.service';
import { FollowupNote } from './entities/followup-note.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FollowupNote, User, Department]),
    JwtModule,
  ],
  controllers: [FollowupsController],
  providers: [FollowupsService, JwtAuthGuard],
  exports: [FollowupsService],
})
export class FollowupsModule {}
