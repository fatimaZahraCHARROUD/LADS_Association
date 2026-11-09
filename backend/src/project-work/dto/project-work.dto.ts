import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray, IsDateString, IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';
import { TASK_STATUSES } from '../schemas/project-task.schema';

export class CreateCellDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsMongoId({ each: true }) members?: string[];
}
export class UpdateCellDto extends PartialType(CreateCellDto) {}

export class CreateTaskDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsMongoId() assignedTo!: string;
  @IsOptional() @IsIn(TASK_STATUSES as unknown as string[]) status?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class UpdateTaskStatusDto {
  @IsIn(TASK_STATUSES as unknown as string[]) status!: string;
}