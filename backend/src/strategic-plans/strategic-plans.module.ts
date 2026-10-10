import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StrategicPlansService } from './strategic-plans.service';
import { StrategicPlansController } from './strategic-plans.controller';
import {
  StrategicPlan,
  StrategicPlanSchema,
} from './schemas/strategic-plan.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StrategicPlan.name, schema: StrategicPlanSchema },
      { name: User.name, schema: UserSchema }, // requis par ActiveRoleGuard
    ]),
    JwtModule,
  ],
  controllers: [StrategicPlansController],
  providers: [StrategicPlansService, JwtAuthGuard],
  exports: [StrategicPlansService],
})
export class StrategicPlansModule {}