import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { CalculationAppService } from './services/calculation-app.service';
import { PreviewRequestDto } from './dtos/preview.request.dto';
import { PreviewResponseDto } from './dtos/preview.response.dto';

@ApiTags('Cálculos Eléctricos')
@Controller('v1/calculations')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CalculosController {
  constructor(private readonly calculationAppService: CalculationAppService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular preview de instalación eléctrica',
    description: 'Calcula carga conectada total, demanda estimada y propuesta preliminar de circuitos para una vivienda',
  })
  @ApiBody({
    type: PreviewRequestDto,
    description: 'Datos de superficies y consumos de la vivienda',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo básico',
        description: 'Vivienda con sala y dormitorio',
        value: {
          superficies: [
            { ambiente: 'Sala', areaM2: 18.5 },
            { ambiente: 'Dormitorio 1', areaM2: 12.0 },
          ],
          consumos: [
            { nombre: 'Televisor', ambiente: 'Sala', watts: 120 },
            { nombre: 'Lámpara', ambiente: 'Dormitorio 1', watts: 60 },
          ],
          opciones: { tensionV: 120, monofasico: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cálculo exitoso',
    type: PreviewResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    schema: {
      type: 'object',
      properties: {
        traceId: { type: 'string' },
        message: { type: 'string' },
        errors: { type: 'array', items: { type: 'string' } },
        timestamp: { type: 'string' },
        path: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Error de validación',
    schema: {
      type: 'object',
      properties: {
        traceId: { type: 'string' },
        message: { type: 'string' },
        errors: { type: 'array', items: { type: 'string' } },
        timestamp: { type: 'string' },
        path: { type: 'string' },
      },
    },
  })
  async preview(@Body() request: PreviewRequestDto): Promise<PreviewResponseDto> {
    return this.calculationAppService.preview(request);
  }
}
