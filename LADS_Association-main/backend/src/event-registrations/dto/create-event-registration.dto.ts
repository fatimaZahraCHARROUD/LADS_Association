export class CreateEventRegistrationDto {
  eventId!: string;
  fullName!: string;
  email!: string;
  phone?: string;
  registrationDate?: Date;
}
