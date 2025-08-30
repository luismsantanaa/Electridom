import { PartialType } from '@nestjs/mapped-types';
import { CreateInstallationTypeDto } from './create-installation-type.dto';

export class UpdateInstallationTypeDto extends PartialType(
  CreateInstallationTypeDto,
) {}
