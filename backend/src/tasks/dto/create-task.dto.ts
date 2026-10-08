// DTO pour POST /tasks
export class CreateTaskDto {
  title!: string;
  description?: string;
  assignedTo!: string; // _id du membre à qui on assigne la tâche
  priority?: 'low' | 'medium' | 'high';
  deadline?: string; // date ISO optionnelle
  status?: 'todo' | 'in-progress' | 'done';
  objectiveId?: string; // _id d'un Objective (optionnel)
}