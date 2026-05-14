import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FormationsService } from './formations.service';
import { FormationsController } from './formations.controller';
import { Formation, FormationSchema } from './schemas/formation.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Formation.name, schema: FormationSchema },
    ]),
    JwtModule,
  ],
  controllers: [FormationsController],
  providers: [FormationsService, JwtAuthGuard],
  exports: [FormationsService],
})
export class FormationsModule {}
