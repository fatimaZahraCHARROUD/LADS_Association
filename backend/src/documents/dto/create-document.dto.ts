export class CreateDocumentDto {
  title!: string;
  category?: string;
  department!: string;
  uploadedBy?: string;
  driveUrl!: string;
  description?: string;
  visibility?: 'public' | 'department' | 'private';
  allowedUsers?: string[];
}
