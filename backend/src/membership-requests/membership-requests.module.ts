import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipRequestsService } from './membership-requests.service';
import { MembershipRequestsController } from './membership-requests.controller';
import { MembershipRequest } from './entities/membership-request.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { JwtModule } from '../services/jwt/jwt.modul';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipRequest, User]),
    JwtModule,
    MailModule,
  ],
  controllers: [MembershipRequestsController],
  providers: [MembershipRequestsService, JwtAuthGuard],
})
export class MembershipRequestsModule {}
