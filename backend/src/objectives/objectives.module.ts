import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ObjectivesService } from './objectives.service';
import { ObjectivesController } from './objectives.controller';
import { Objective, ObjectiveSchema } from './schemas/objective.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { JwtModule } from '../services/jwt/jwt.modul';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Objective.name, schema: ObjectiveSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule,
  ],
  controllers: [ObjectivesController],
  providers: [ObjectivesService, JwtAuthGuard],
  exports: [ObjectivesService],
})
export class ObjectivesModule {}