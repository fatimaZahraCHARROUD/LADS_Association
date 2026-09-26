import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepartmentMembersController } from './department-members.controller';
import { DepartmentMembersService } from './department-members.service';
import {
  DepartmentMember,
  DepartmentMemberSchema,
} from './schemas/department-member.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DepartmentMember.name, schema: DepartmentMemberSchema },
    ]),
    JwtModule,
  ],
  controllers: [DepartmentMembersController],
  providers: [DepartmentMembersService, JwtAuthGuard],
})
export class DepartmentMembersModule {}