import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { Cellule, CelluleSchema } from '../cellules/schemas/cellule.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Cellule.name, schema: CelluleSchema },
    ]),
    JwtModule,
  ],
  controllers: [MembersController],
  providers: [MembersService, JwtAuthGuard],
})
export class MembersModule {}