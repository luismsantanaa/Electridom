import { PartialType } from '@nestjs/mapped-types';
import { CreateCargaDto } from './create-carga.dto';

export class UpdateCargaDto extends PartialType(CreateCargaDto) {}
