import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentPermissionsService } from './document-permissions.service';
import { DocumentPermissionsController } from './document-permissions.controller';
import {
  DocumentPermission,
  DocumentPermissionSchema,
} from './schemas/document-permission.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentPermission.name, schema: DocumentPermissionSchema },
    ]),
    JwtModule,
  ],
  controllers: [DocumentPermissionsController],
  providers: [DocumentPermissionsService, JwtAuthGuard],
  exports: [DocumentPermissionsService],
})
export class DocumentPermissionsModule {}
