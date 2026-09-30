import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactMessagesService } from './contact-messages.service';
import { ContactMessagesController } from './contact-messages.controller';
import { ContactMessage, ContactMessageSchema } from './schemas/contact-message.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { MailModule } from '../mail/mail.module';
import { User, UserSchema } from '../users/schemas/user.schema';   // ← NEW

@Module({
  imports: [MongooseModule.forFeature([{ name: ContactMessage.name, schema: ContactMessageSchema },{ name: User.name, schema: UserSchema }, ]),JwtModule,MailModule],
  controllers: [ContactMessagesController],
  providers: [ContactMessagesService,JwtAuthGuard],
})
export class ContactMessagesModule {}
