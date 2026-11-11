import { IsEnum } from 'class-validator';

// Petit DTO utilisé uniquement pour PATCH /tasks/:id/status
export class UpdateTaskStatusDto {
  @IsEnum(['todo', 'in-progress', 'done'])
  status!: 'todo' | 'in-progress' | 'done';
}
