import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventRegistrationsService } from './event-registrations.service';
import { EventRegistrationsController } from './event-registrations.controller';
import { EventRegistration, EventRegistrationSchema } from './schemas/event-registration.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: EventRegistration.name, schema: EventRegistrationSchema }])],
  controllers: [EventRegistrationsController],
  providers: [EventRegistrationsService],
})
export class EventRegistrationsModule {}
