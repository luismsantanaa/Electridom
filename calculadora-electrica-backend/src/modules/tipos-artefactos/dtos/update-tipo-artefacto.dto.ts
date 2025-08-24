import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoArtefactoDto } from './create-tipo-artefacto.dto';

export class UpdateTipoArtefactoDto extends PartialType(
  CreateTipoArtefactoDto,
) {}
