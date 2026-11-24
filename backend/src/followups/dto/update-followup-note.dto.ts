import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateFollowupNoteDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @IsOptional()
  @IsEnum(['info', 'warning', 'action'])
  noteType?: 'info' | 'warning' | 'action';
}
