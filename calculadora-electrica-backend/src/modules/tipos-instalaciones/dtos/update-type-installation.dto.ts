import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoInstalacionDto } from './create-type-installation.dto';

export class UpdateTipoInstalacionDto extends PartialType(
  CreateTipoInstalacionDto,
) {}

