import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipRequestsService } from './membership-requests.service';
import { MembershipRequestsController } from './membership-requests.controller';
import { MembershipRequest, MembershipRequestSchema } from './schemas/membership-request.schema';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: MembershipRequest.name, schema: MembershipRequestSchema }]),JwtModule,MailModule],
  controllers: [MembershipRequestsController],
  providers: [MembershipRequestsService,JwtAuthGuard],
})
export class MembershipRequestsModule {}
