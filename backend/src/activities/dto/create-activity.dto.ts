import { LocalizedStringDto } from '../../events/dto/create-event.dto';

export class CreateActivityDto {
  title: LocalizedStringDto;
  description: LocalizedStringDto;
  activityDate: string;
  location?: string;
  images?: string[];
  categorie?: string;
  status?: 'upcoming' | 'completed';
  isPublished?: boolean;
  createdBy?: string;
}
