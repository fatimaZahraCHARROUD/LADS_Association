export class CreateDocumentDto {
  title!: string;
  category?: string;
  driveUrl!: string;
  description?: string;
  visibility?: 'all' | 'private';
}
