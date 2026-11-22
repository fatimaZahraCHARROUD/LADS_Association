import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormationsService } from './formations.service';
import { FormationsController } from './formations.controller';
import { Formation } from './entities/formation.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { UploadModule } from '../upload/upload.module';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';
import {
  MemberFormationsController,
  AdminFormationsController,
} from './formations-private.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Formation, User]),
    JwtModule,
    UploadModule,
  ],
  controllers: [
    FormationsController,
    MemberFormationsController,
    AdminFormationsController,
  ],
  providers: [FormationsService, JwtAuthGuard, ActiveRoleGuard],
  exports: [FormationsService],
})
export class FormationsModule {}
