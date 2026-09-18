import { PartialType } from '@nestjs/mapped-types';
import { CreateLadsInfoDto } from './create-lads-info.dto';

export class UpdateLadsInfoDto extends PartialType(CreateLadsInfoDto) {}
