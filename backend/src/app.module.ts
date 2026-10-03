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
import { UploadModule } from './upload/upload.module';
import { MembersModule } from './members/members.module';
import { DepartmentsModule } from './departments/departments.module';
import { RolesModule } from './roles/roles.module';
import { DepartmentMembersModule } from './department-members/department-members.module';
import { DocumentsModule } from './documents/documents.module';
import { DocumentPermissionsModule } from './document-permissions/document-permissions.module';
import { MeetingsModule } from './meetings/meetings.module';
import { StrategicPlansModule } from './strategic-plans/strategic-plans.module';
// import { APP_GUARD } from '@nestjs/core';
// import { JwtAuthGuard } from './services/jwt/jwt.guard';
// import { ActiveRoleGuard } from './services/jwt/active-role.guard';
// import { MongooseModule } from '@nestjs/mongoose';
// import { User, UserSchema } from './users/schemas/user.schema';

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
    UploadModule,
    MembersModule,
    DepartmentsModule,
    RolesModule,
    DepartmentMembersModule,
    DocumentsModule,
    DocumentPermissionsModule,
    MeetingsModule,
    StrategicPlansModule,
     //MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
 
})
export class AppModule {}
