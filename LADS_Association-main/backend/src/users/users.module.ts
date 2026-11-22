import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),JwtModule],
  controllers: [UsersController],
  providers: [UsersService,JwtAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
