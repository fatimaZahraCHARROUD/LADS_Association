import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { LadsDocument, DocumentSchema } from './schemas/document.schema';
import { Department, DepartmentSchema } from '../departments/schemas/department.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { WriterRoleGuard } from '../services/jwt/writer-role.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { UsersModule } from '../users/users.module';
import { User, UserSchema } from '../users/schemas/user.schema'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LadsDocument.name, schema: DocumentSchema },
      { name: Department.name, schema: DepartmentSchema },
      {name: User.name, schema: UserSchema}
    ]),
    JwtModule,
    UsersModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, JwtAuthGuard, WriterRoleGuard],
  exports: [DocumentsService],
})
export class DocumentsModule {}
