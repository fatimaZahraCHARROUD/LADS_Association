import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipRequestsService } from './membership-requests.service';
import { MembershipRequestsController } from './membership-requests.controller';
import { MembershipRequest, MembershipRequestSchema } from './schemas/membership-request.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: MembershipRequest.name, schema: MembershipRequestSchema }])],
  controllers: [MembershipRequestsController],
  providers: [MembershipRequestsService],
})
export class MembershipRequestsModule {}
