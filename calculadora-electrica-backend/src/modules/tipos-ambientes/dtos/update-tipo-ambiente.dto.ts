import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoAmbienteDto } from './create-tipo-ambiente.dto';

export class UpdateTipoAmbienteDto extends PartialType(CreateTipoAmbienteDto) {}
