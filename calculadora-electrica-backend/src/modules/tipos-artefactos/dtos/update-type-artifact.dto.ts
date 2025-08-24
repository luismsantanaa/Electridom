import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoArtefactoDto } from './create-type-artifact.dto';

export class UpdateTipoArtefactoDto extends PartialType(
  CreateTipoArtefactoDto,
) {}

