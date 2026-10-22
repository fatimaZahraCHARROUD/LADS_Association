export class LocalizedStringDto {
  en!: string;
  fr!: string;
  ar!: string;
}

export class CreateFormationDto {
  title!: LocalizedStringDto;
  description!: LocalizedStringDto;
  imgUrl?: string;
    coverImagePublicId?: string;

  date!: string;
  heure?: string;
  category?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  registrationLink?: string;
  isPublished?: boolean;
  createdBy?: string;
}
