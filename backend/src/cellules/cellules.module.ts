import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CellulesService } from './cellules.service';
import { CellulesController } from './cellules.controller';
import { Cellule, CelluleSchema } from './schemas/cellule.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { JwtModule } from '../services/jwt/jwt.modul';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';

@Module({
  imports: [
    // On enregistre les schémas utilisés dans CE module
    // (le guard de rôles a besoin de User pour lire le rôle actif)
    MongooseModule.forFeature([
      { name: Cellule.name, schema: CelluleSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule,
  ],
  controllers: [CellulesController],
  providers: [CellulesService, JwtAuthGuard],
  exports: [CellulesService],
})
export class CellulesModule {}