export class UpdateDepartmentDto {
  name?: string;
  manager?: string | null;
  viceManager?: string | null;
  teamManagers?: string[];
  members?: string[];
}
