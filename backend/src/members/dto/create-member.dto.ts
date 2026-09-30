import { IsOptional, IsString, IsArray, IsBoolean, IsEmail } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  genre?: string;

  @IsOptional() @IsString()
  birthday?: string;

  @IsOptional() @IsString()
  ville?: string;

  @IsOptional() @IsString()
  niveau_etude?: string;

  @IsOptional() @IsString()
  specialite_etude?: string;

  @IsOptional() @IsString()
  situation?: string;

  @IsOptional() @IsArray()
  departement?: string[];

  @IsOptional() @IsString()
  date_adhesion?: string;

  @IsOptional() @IsBoolean()
  cotisation_payee?: boolean;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  role?: string;
}