import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { User } from '../users/entities/user.entity';
import { Membership } from '../users/entities/membership.entity';
import { Department } from '../departments/entities/department.entity';
import { Cellule } from '../cellules/entities/cellule.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Membership, Department, Cellule]),
    JwtModule,
  ],
  controllers: [MembersController],
  providers: [MembersService, JwtAuthGuard],
})
export class MembersModule {}
