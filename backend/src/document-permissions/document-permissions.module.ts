import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentPermissionsService } from './document-permissions.service';
import { DocumentPermissionsController } from './document-permissions.controller';
import { DocumentPermission } from './entities/document-permission.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentPermission]),
    JwtModule,
  ],
  controllers: [DocumentPermissionsController],
  providers: [DocumentPermissionsService, JwtAuthGuard],
  exports: [DocumentPermissionsService],
})
export class DocumentPermissionsModule {}
