import { Module } from '@nestjs/common';
import { DatabaseConfig } from './config/database.config';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { FormationsModule } from './formations/formations.module';
import { ActivitiesModule } from './activities/activities.module';
import { NewsModule } from './news/news.module';
import { LadsInfoModule } from './lads-info/lads-info.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';
import { MembershipRequestsModule } from './membership-requests/membership-requests.module';
import { EventRegistrationsModule } from './event-registrations/event-registrations.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    DatabaseConfig,
    UsersModule,
    EventsModule,
    FormationsModule,
    ActivitiesModule,
    NewsModule,
    LadsInfoModule,
    ContactMessagesModule,
    MembershipRequestsModule,
    EventRegistrationsModule,
    AuthModule,
  ],
})
export class AppModule {}
