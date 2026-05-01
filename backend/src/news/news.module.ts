import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { News, NewsSchema } from './schemas/news.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: News.name, schema: NewsSchema }])],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
