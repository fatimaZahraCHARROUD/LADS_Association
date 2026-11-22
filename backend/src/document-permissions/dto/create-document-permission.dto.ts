export class CreateDocumentPermissionDto {
  document!: string;
  permissionType!: 'department' | 'user';
  department?: string;
  user?: string;
  canView?: boolean;
  canDelete?: boolean;
}
