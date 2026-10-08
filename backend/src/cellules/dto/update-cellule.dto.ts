import { PartialType } from '@nestjs/mapped-types';
import { CreateCelluleDto } from './create-cellule.dto';

// Le même formulaire mais TOUS les champs optionnels (pour un PATCH)
export class UpdateCelluleDto extends PartialType(CreateCelluleDto) {}