import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrategicPlansService } from './strategic-plans.service';
import { StrategicPlansController } from './strategic-plans.controller';
import { StrategicPlan } from './entities/strategic-plan.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    TypeOrmModule.forFeature([StrategicPlan, User]),
    JwtModule,
  ],
  controllers: [StrategicPlansController],
  providers: [StrategicPlansService, JwtAuthGuard],
  exports: [StrategicPlansService],
})
export class StrategicPlansModule {}
