import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '../services/jwt/jwt.modul';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { DepartmentsAdminGuard } from './departments-admin.guard';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department, User]),
    UsersModule,
    JwtModule,
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentsAdminGuard],
})
export class DepartmentsModule {}
