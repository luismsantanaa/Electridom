import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ArtifactTypesService } from './artifact-types.service';
import { CreateArtifactTypeDto } from './dtos/create-artifact-type.dto';
import { UpdateArtifactTypeDto } from './dtos/update-artifact-type.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Artifact Types')
@Controller('tipos-artefactos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ArtifactTypesController {
  constructor(private readonly artifactTypesService: ArtifactTypesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INGENIERO)
  @ApiOperation({ summary: 'Create a new artifact type' })
  @ApiResponse({
    status: 201,
    description: 'Artifact type created successfully',
  })
  create(
    @Body() createArtifactTypeDto: CreateArtifactTypeDto,
    @Request() req: any,
  ) {
    return this.artifactTypesService.create(createArtifactTypeDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all artifact types with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Artifact types retrieved successfully',
  })
  findAll(@Query() query: any) {
    return this.artifactTypesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get artifact type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Artifact type retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Artifact type not found',
  })
  findOne(@Param('id') id: string) {
    return this.artifactTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.INGENIERO)
  @ApiOperation({ summary: 'Update artifact type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Artifact type updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Artifact type not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateArtifactTypeDto: UpdateArtifactTypeDto,
    @Request() req: any,
  ) {
    return this.artifactTypesService.update(
      id,
      updateArtifactTypeDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete artifact type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Artifact type deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Artifact type not found',
  })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.artifactTypesService.remove(id, req.user.id);
  }
}
