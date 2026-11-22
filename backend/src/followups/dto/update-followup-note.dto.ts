import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateFollowupNoteDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string | null;

  @IsOptional()
  @IsMongoId()
  memberId?: string | null;

  @IsOptional()
  @IsEnum(['info', 'warning', 'action'])
  noteType?: 'info' | 'warning' | 'action';
}
