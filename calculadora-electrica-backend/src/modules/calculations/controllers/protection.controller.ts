import { Controller, Get, Post, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProtectionService } from '../services/protection.service';
import { CreateProtectionDto, UpdateProtectionDto, ProtectionResponseDto, CircuitProtectionDto, RecalculateProtectionsDto } from '../dtos/protection.dto';

@ApiTags('Protecciones Eléctricas')
@Controller('api/protections')
export class ProtectionController {
  constructor(private readonly protectionService: ProtectionService) {}

  @Get(':circuitId')
  @ApiOperation({ summary: 'Obtener protección de un circuito específico' })
  @ApiParam({ name: 'circuitId', description: 'ID del circuito', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Protección encontrada', 
    type: ProtectionResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Protección no encontrada' 
  })
  async getProtectionByCircuitId(
    @Param('circuitId', ParseIntPipe) circuitId: number
  ): Promise<ProtectionResponseDto> {
    return this.protectionService.getProtectionByCircuitId(circuitId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Obtener todas las protecciones de un proyecto' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de protecciones del proyecto', 
    type: [CircuitProtectionDto] 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proyecto no encontrado' 
  })
  async getProtectionsByProjectId(
    @Param('projectId', ParseIntPipe) projectId: number
  ): Promise<CircuitProtectionDto[]> {
    return this.protectionService.getProtectionsByProjectId(projectId);
  }

  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalcular todas las protecciones de un proyecto' })
  @ApiBody({ type: RecalculateProtectionsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Protecciones recalculadas exitosamente', 
    type: [ProtectionResponseDto] 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos de entrada inválidos' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Proyecto no encontrado' 
  })
  async recalculateProtections(
    @Body() recalculateDto: RecalculateProtectionsDto
  ): Promise<ProtectionResponseDto[]> {
    return this.protectionService.recalculateProtections(recalculateDto.projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva protección' })
  @ApiBody({ type: CreateProtectionDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Protección creada exitosamente', 
    type: ProtectionResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos de entrada inválidos' 
  })
  async createProtection(
    @Body() createProtectionDto: CreateProtectionDto
  ): Promise<ProtectionResponseDto> {
    return this.protectionService.createProtection(createProtectionDto);
  }

  @Post(':id')
  @ApiOperation({ summary: 'Actualizar una protección existente' })
  @ApiParam({ name: 'id', description: 'ID de la protección', type: 'number' })
  @ApiBody({ type: UpdateProtectionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Protección actualizada exitosamente', 
    type: ProtectionResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos de entrada inválidos' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Protección no encontrada' 
  })
  async updateProtection(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProtectionDto: UpdateProtectionDto
  ): Promise<ProtectionResponseDto> {
    return this.protectionService.updateProtection(id, updateProtectionDto);
  }
}
