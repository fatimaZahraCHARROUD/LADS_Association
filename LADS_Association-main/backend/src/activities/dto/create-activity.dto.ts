import { LocalizedStringDto } from '../../events/dto/create-event.dto';

export class CreateActivityDto {
  title!: LocalizedStringDto;
  description!: LocalizedStringDto;
  activityDate!: string;
  location?: string;
  image?: string;
  coverImagePublicId?: string;
  categorie?: string;
  status?: 'upcoming' | 'completed';
  isPublished?: boolean;
  createdBy?: string;
}
