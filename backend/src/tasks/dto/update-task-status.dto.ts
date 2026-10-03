// Petit DTO utilisé uniquement pour PATCH /tasks/:id/status
export class UpdateTaskStatusDto {
  status!: 'todo' | 'in-progress' | 'done';
}