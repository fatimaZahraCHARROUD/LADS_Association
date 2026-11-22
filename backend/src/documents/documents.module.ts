import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { LadsDocument } from './entities/document.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { WriterRoleGuard } from '../services/jwt/writer-role.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { UsersModule } from '../users/users.module';
import { ActiveRoleGuard } from '../services/jwt/active-role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([LadsDocument, Department, User]),
    JwtModule,
    UsersModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, JwtAuthGuard, WriterRoleGuard, ActiveRoleGuard],
  exports: [DocumentsService],
})
export class DocumentsModule {}
