import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LadsInfoService } from './lads-info.service';
import { LadsInfoController } from './lads-info.controller';
import { LadsInfo, LadsInfoSchema } from './schemas/lads-info.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { User, UserSchema } from '../users/schemas/user.schema';   

@Module({
  imports: [MongooseModule.forFeature([{ name: LadsInfo.name, schema: LadsInfoSchema },{ name: User.name, schema: UserSchema },]),JwtModule],
  controllers: [LadsInfoController],
  providers: [LadsInfoService,JwtAuthGuard],
  exports: [LadsInfoService],
})
export class LadsInfoModule {}
