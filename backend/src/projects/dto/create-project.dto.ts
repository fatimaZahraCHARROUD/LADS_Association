export class CreateProjectDto {
  title!: string;
  description?: string;
  img?: string;
  departmentId?: string | null;
  managerIds?: string[];
  memberIds?: string[];
  startDate!: string;
  endDate!: string;
  status?: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  progress?: number;
  driveUrl?: string;
  isPublished?: boolean;
}