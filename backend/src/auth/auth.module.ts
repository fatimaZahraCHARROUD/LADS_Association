import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HashService } from '../services/hash.service';
 import { UsersModule } from '../users/users.module';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  controllers: [AuthController],
    imports: [UsersModule,JwtModule],

  providers: [AuthService,HashService],
})
export class AuthModule {}
