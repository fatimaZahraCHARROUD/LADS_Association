import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectivesService } from './objectives.service';
import { ObjectivesController } from './objectives.controller';
import { Objective } from './entities/objective.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '../services/jwt/jwt.modul';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Objective, Department, User]),
    JwtModule,
  ],
  controllers: [ObjectivesController],
  providers: [ObjectivesService, JwtAuthGuard],
  exports: [ObjectivesService],
})
export class ObjectivesModule {}
