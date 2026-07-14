import { PartialType } from '@nestjs/mapped-types';
import { CreateEnvironmentTypeDto } from './create-environment-type.dto';

export class UpdateEnvironmentTypeDto extends PartialType(
  CreateEnvironmentTypeDto,
) {}
