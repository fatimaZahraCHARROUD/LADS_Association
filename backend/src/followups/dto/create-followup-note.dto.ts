import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFollowupNoteDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

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
