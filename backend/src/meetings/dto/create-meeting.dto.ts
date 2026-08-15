export class CreateMeetingDto {
  title!: string;
  description?: string;
  department!: string;
  startAt!: string;
  endAt!: string;
  meetingLink?: string;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  participants?: string[];
  createdBy?: string;
}
