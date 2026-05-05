export class CreateUserDto {
  fullName: string;
  email: string;
  password: string;
  role?: string[];
  genre?: string;
  profileImage?: string;
  phone?: string;
  birthday?: string;
  ville?: string;
  niveau_etude?: string;
  specialite_etude?: string;
  situation?: string;
  departement?: string[];
  date_adhesion?: string;
  cotisation_payee?: boolean;
}
