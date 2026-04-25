import { Module } from '@nestjs/common';
import { DatabaseConfig } from './config/database.config';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [UsersModule, DatabaseConfig, EventsModule],
  providers: [],
})
export class AppModule {}
