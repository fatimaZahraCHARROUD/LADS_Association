export class CreateStrategicPlanDto {
  title!: string;
  objective!: string;
  description?: string;
  deadline!: string;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}