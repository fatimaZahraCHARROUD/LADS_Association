// DTO pour POST /objectives
export class CreateObjectiveDto {
  title!: string;
  description?: string;
  weekStart!: string; // date au format ISO (ex: 2026-10-05)
  weekEnd!: string;
  target?: number;
  achievement?: number;
  status?: 'pending' | 'in-progress' | 'completed';
  departmentId?: string; // _id d'un Department (pour filtrer par département)
}