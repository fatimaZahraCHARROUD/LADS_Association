import { LocalizedStringDto } from '../../events/dto/create-event.dto';

export class CreateNewsDto {
  title: LocalizedStringDto;
  content: LocalizedStringDto;
  thumbnail?: string;
  tags?: string[];
  isPublished?: boolean;
  authorId?: string;
  publishedAt?: Date;
}
