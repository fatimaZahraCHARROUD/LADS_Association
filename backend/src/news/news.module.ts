import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { News } from './entities/news.entity';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '../services/jwt/jwt.modul';
import { JwtAuthGuard } from '../services/jwt/jwt.guard';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([News, User]),
    JwtModule,
    UploadModule,
  ],
  controllers: [NewsController],
  providers: [NewsService, JwtAuthGuard],
  exports: [NewsService],
})
export class NewsModule {}
