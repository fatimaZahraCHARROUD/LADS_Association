import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CellulesService } from './cellules.service';
import { CellulesController } from './cellules.controller';
import { Cellule } from './entities/cellule.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '../services/jwt/jwt.modul';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cellule, Department, User]),
    JwtModule,
  ],
  controllers: [CellulesController],
  providers: [CellulesService, JwtAuthGuard, ActiveRoleGuard],
  exports: [CellulesService],
})
export class CellulesModule {}
