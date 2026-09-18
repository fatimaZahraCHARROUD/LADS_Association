import { LocalizedStringDto } from '../../events/dto/create-event.dto';

export class CreateLadsInfoDto {
  title: LocalizedStringDto;
  content: LocalizedStringDto;
  updatedBy?: string;
}
