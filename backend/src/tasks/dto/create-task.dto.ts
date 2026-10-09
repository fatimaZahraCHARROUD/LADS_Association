// DTO pour POST /tasks
export class CreateTaskDto {
  title!: string;
  description?: string;
  assignedTo!: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
  status?: 'todo' | 'in-progress' | 'done';
  objectiveId?: string;
  departmentId?: string; // 👈 NEW: used only by global roles
}