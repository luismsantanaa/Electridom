import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import {
  ListExportsQueryDto,
  ExportListResponseDto,
  CreateExportDto,
} from './dtos/export.dto';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('exportaciones')
@Controller('v1/exports')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @ApiOperation({
    summary: 'Listar exportaciones',
    description: 'Lista exportaciones con paginación',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    description: 'Tamaño de página',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de exportaciones obtenida exitosamente',
    type: ExportListResponseDto,
  })
  async listExports(
    @Query() query: ListExportsQueryDto,
  ): Promise<ExportListResponseDto> {
    return this.exportsService.listExports(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: 'Crear exportación',
    description: 'Crea una nueva exportación de un proyecto',
  })
  @ApiBody({
    type: CreateExportDto,
    description: 'Datos de la exportación',
  })
  @ApiResponse({
    status: 201,
    description: 'Exportación creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async createExport(@Body() dto: CreateExportDto): Promise<void> {
    return this.exportsService.createExport(dto);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @ApiOperation({
    summary: 'Descargar exportación',
    description: 'Descarga el archivo de exportación',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la exportación',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo descargado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Exportación no encontrada',
  })
  async downloadExport(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    return this.exportsService.downloadExport(id, res);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({
    summary: 'Eliminar exportación',
    description: 'Elimina el registro de exportación',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la exportación',
    example: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Exportación eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Exportación no encontrada',
  })
  async deleteExport(@Param('id') id: string): Promise<void> {
    return this.exportsService.deleteExport(id);
  }
}
