export class CreateMemberDto {
  fullName!: string;
  email!: string;
  password!: string;
  phone?: string;
  genre?: string;
  birthday?: string;
  ville?: string;
  niveau_etude?: string;
  specialite_etude?: string;
  situation?: string;
  departement?: string[];
  date_adhesion?: string;
  cotisation_payee?: boolean;
  status?: string;
}