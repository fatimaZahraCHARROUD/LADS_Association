// DTO pour POST /meetings
export class CreateMeetingDto {
  title!: string;
  description?: string;
  startAt!: string;
  endAt!: string;
  meetingLink?: string;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  participants?: string[];
  departmentId?: string; // _id du département concerné (obligatoire pour un Team Manager)
}