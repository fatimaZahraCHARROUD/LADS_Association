import { LocalizedStringDto } from '../../events/dto/create-event.dto';
import { IsMongoId, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsMongoId()
  memberId?: string;
}
