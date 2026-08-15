export class CreateDocumentDto {
  title!: string;
  category?: string;
  department!: string;
  uploadedBy?: string;
  driveUrl!: string;
  description?: string;
}
