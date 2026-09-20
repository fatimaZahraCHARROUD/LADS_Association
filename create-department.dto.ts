export class CreateDepartmentDto {
  name!: string;
  description?: string;
  manager?: string | null;
  viceManager?: string | null;
  teamManagers?: string[];
  members?: string[];
}
