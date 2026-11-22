import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LadsInfoService } from './lads-info.service';
import { LadsInfoController } from './lads-info.controller';
import { LadsInfo } from './entities/lads-info.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    TypeOrmModule.forFeature([LadsInfo, User]),
    JwtModule,
  ],
  controllers: [LadsInfoController],
  providers: [LadsInfoService, JwtAuthGuard],
  exports: [LadsInfoService],
})
export class LadsInfoModule {}
