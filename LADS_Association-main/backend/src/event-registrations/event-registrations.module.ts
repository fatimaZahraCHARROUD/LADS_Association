import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventRegistrationsService } from './event-registrations.service';
import { EventRegistrationsController } from './event-registrations.controller';
import { EventRegistration, EventRegistrationSchema } from './schemas/event-registration.schema';
import { JwtModule } from '../services/jwt/jwt.modul';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: EventRegistration.name, schema: EventRegistrationSchema }]),JwtModule,MailModule],
  controllers: [EventRegistrationsController],
  providers: [EventRegistrationsService,JwtAuthGuard],
})
export class EventRegistrationsModule {}
