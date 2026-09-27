import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '../services/jwt/jwt.modul';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { DepartmentsAdminGuard } from './departments-admin.guard';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { Department, DepartmentSchema } from './schemas/department.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
    JwtModule,
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentsAdminGuard],
})
export class DepartmentsModule {}
