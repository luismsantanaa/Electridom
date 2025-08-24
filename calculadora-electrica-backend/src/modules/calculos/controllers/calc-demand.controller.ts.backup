import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DemandService } from '../services/demand.service';
import { CalcDemandRequestDto } from '../dtos/calc-demand-request.dto';
import { CalcDemandResponseDto } from '../dtos/calc-demand-response.dto';

@ApiTags('Cálculos Eléctricos')
@Controller('calc')
export class CalcDemandController {
  constructor(private readonly demandService: DemandService) {}

  @Post('demand/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aplicar factores de demanda y calcular carga diversificada',
    description:
      'Aplica factores de demanda por categoría de carga conforme RIE/NEC parametrizados y calcula la carga diversificada total',
  })
  @ApiBody({
    type: CalcDemandRequestDto,
    description: 'Cargas agrupadas por categoría (típicamente salida de CE-01)',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo de cálculo de demanda diversificada',
        description: 'Aplicación de factores de demanda a cargas residenciales',
        value: {
          cargas_por_categoria: [
            {
              categoria: 'lighting_general',
              carga_va: 1453.5,
              descripcion: 'Iluminación general de todos los ambientes',
            },
            {
              categoria: 'tomas_generales',
              carga_va: 800.0,
              descripcion: 'Tomacorrientes generales',
            },
            {
              categoria: 'electrodomesticos',
              carga_va: 1473.7,
              descripcion: 'Nevera, microondas, lavadora, TV',
            },
            {
              categoria: 'climatizacion',
              carga_va: 1222.2,
              descripcion: 'Aires acondicionados',
            },
          ],
          totales: {
            carga_total_va: 4949.4,
            tension_v: 120,
            phases: 1,
          },
          observaciones: [
            'Cargas calculadas desde CE-01',
            'Factores RIE/NEC aplicables',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Factores de demanda aplicados exitosamente',
    type: CalcDemandResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async calculateDemandFactors(
    @Body() request: CalcDemandRequestDto,
  ): Promise<CalcDemandResponseDto> {
    return this.demandService.apply(request);
  }
}
