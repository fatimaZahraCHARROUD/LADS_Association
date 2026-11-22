import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// DTO pour POST /tasks
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  assignedTo!: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsDateString()
  deadline?: string | null;

  @IsOptional()
  @IsEnum(['todo', 'in-progress', 'done'])
  status?: 'todo' | 'in-progress' | 'done';

  @IsOptional()
  @IsMongoId()
  objectiveId?: string | null;

  @IsOptional()
  @IsMongoId()
  departmentId?: string | null;
}
