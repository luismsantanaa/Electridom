import { PartialType } from '@nestjs/mapped-types';
import { CreateAmbienteDto } from './create-environment.dto';

export class UpdateAmbienteDto extends PartialType(CreateAmbienteDto) {}

