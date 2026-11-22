import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactMessagesService } from './contact-messages.service';
import { ContactMessagesController } from './contact-messages.controller';
import { ContactMessage } from './entities/contact-message.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactMessage, User]),
    JwtModule,
    MailModule,
  ],
  controllers: [ContactMessagesController],
  providers: [ContactMessagesService, JwtAuthGuard],
})
export class ContactMessagesModule {}
