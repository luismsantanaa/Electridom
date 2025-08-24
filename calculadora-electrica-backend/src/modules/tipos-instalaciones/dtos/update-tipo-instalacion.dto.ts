import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoInstalacionDto } from './create-tipo-instalacion.dto';

export class UpdateTipoInstalacionDto extends PartialType(
  CreateTipoInstalacionDto,
) {}
