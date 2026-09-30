import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { News, NewsSchema } from './schemas/news.schema';
import { JwtModule } from '../services/jwt/jwt.modul';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { UploadModule } from '../upload/upload.module';
import { User, UserSchema } from '../users/schemas/user.schema';   // ← NEW

@Module({
  imports: [MongooseModule.forFeature([{ name: News.name, schema: NewsSchema },{ name: User.name, schema: UserSchema },]),JwtModule,UploadModule],
  controllers: [NewsController],
  providers: [NewsService,JwtAuthGuard],
  exports: [NewsService],
})
export class NewsModule {}
