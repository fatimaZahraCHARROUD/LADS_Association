import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity } from './entities/activity.entity';
import { User } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, User, Department]),
    JwtModule,
    UploadModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, JwtAuthGuard],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
