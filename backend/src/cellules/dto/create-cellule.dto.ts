// DTO = Document To Object : décrit le corps (body) d'une requête POST
export class CreateCelluleDto {
  name!: string;
  description?: string;
  departmentId!: string; // _id d'un Department
  managerId!: string; // _id du User responsable
  members?: string[]; // _ids des membres
  status?: 'active' | 'inactive';
}