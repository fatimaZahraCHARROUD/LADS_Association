import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { UploadModule } from '../upload/upload.module';
import { User, UserSchema } from '../users/schemas/user.schema';   // ← NEW

@Module({
  imports: [MongooseModule.forFeature([{ name: Event.name, schema: EventSchema },{ name: User.name, schema: UserSchema },]),JwtModule,UploadModule,],
  controllers: [EventsController],
  providers: [EventsService,JwtAuthGuard],
  exports: [EventsService],
})
export class EventsModule {}
