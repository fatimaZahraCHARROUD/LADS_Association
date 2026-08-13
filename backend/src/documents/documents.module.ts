import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { LadsDocument, DocumentSchema } from './schemas/document.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LadsDocument.name, schema: DocumentSchema },
    ]),
    JwtModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, JwtAuthGuard],
  exports: [DocumentsService],
})
export class DocumentsModule {}
