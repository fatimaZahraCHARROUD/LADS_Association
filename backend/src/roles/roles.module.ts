import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    JwtModule,
  ],
  controllers: [RolesController],
  providers: [RolesService, JwtAuthGuard],
})
export class RolesModule {}
