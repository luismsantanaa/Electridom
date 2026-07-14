import { PartialType } from '@nestjs/swagger';
import { CreateArtifactTypeDto } from './create-artifact-type.dto';

export class UpdateArtifactTypeDto extends PartialType(CreateArtifactTypeDto) {}
