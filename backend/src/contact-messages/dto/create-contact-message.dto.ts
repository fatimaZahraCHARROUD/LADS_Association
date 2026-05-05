export class CreateContactMessageDto {
  fullName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}
