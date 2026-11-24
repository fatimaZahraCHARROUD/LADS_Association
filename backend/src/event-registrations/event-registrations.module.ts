import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRegistrationsService } from './event-registrations.service';
import { EventRegistrationsController } from './event-registrations.controller';
import { EventRegistration } from './entities/event-registration.entity';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '../services/jwt/jwt.modul';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventRegistration, User]),
    JwtModule,
    MailModule,
  ],
  controllers: [EventRegistrationsController],
  providers: [EventRegistrationsService, JwtAuthGuard],
})
export class EventRegistrationsModule {}
