import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { UploadModule } from '../upload/upload.module';
import { User, UserSchema } from '../users/schemas/user.schema'; // ← NEW
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    JwtModule,
    UploadModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, JwtAuthGuard],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
