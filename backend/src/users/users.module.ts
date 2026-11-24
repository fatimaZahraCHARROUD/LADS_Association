import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Membership } from './entities/membership.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Membership]),
    JwtModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
