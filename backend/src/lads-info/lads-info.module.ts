import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LadsInfoService } from './lads-info.service';
import { LadsInfoController } from './lads-info.controller';
import { LadsInfo, LadsInfoSchema } from './schemas/lads-info.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: LadsInfo.name, schema: LadsInfoSchema }])],
  controllers: [LadsInfoController],
  providers: [LadsInfoService],
  exports: [LadsInfoService],
})
export class LadsInfoModule {}
