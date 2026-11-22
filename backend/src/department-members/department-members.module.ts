import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentMembersController } from './department-members.controller';
import { DepartmentMembersService } from './department-members.service';
import { DepartmentMember } from './entities/department-member.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    TypeOrmModule.forFeature([DepartmentMember]),
    JwtModule,
  ],
  controllers: [DepartmentMembersController],
  providers: [DepartmentMembersService, JwtAuthGuard],
})
export class DepartmentMembersModule {}
