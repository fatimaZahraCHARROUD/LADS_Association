export class CreateMeetingDto {
  title!: string;
  description?: string;
  startAt!: string;
  endAt!: string;
  meetingLink?: string;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  participants?: string[];
}
