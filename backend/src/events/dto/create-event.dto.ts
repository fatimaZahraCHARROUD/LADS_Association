export class LocalizedStringDto {
  en: string;
  fr: string;
  ar: string;
}

export class CreateEventDto {
  title: LocalizedStringDto;
  description: LocalizedStringDto;
  category?: string;
  date: string;
  time?: string;
  location?: string;
  maxParticipants?: number;
  coverImage?: string;
  registerLink?: string;
  status?: 'upcoming' | 'past';
  isPublished?: boolean;
  createdBy?: string;
}
