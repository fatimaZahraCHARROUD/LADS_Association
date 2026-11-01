import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { FollowupsController } from './followups.controller';
import { FollowupsService } from './followups.service';
import {
  FollowupNote,
  FollowupNoteSchema,
} from './schemas/followup-note.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FollowupNote.name, schema: FollowupNoteSchema },
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    JwtModule,
  ],
  controllers: [FollowupsController],
  providers: [FollowupsService, JwtAuthGuard],
  exports: [FollowupsService],
})
export class FollowupsModule {}
