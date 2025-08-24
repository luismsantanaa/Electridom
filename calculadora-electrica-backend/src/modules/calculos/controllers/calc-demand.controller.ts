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
    summary: 'Aplicar factores de demanda y calcular load diversificada',
    description:
      'Aplica factores de demanda por categoría de load conforme RIE/NEC parametrizados y calcula la load diversificada total',
  })
  @ApiBody({
    type: CalcDemandRequestDto,
    description: 'loads agrupadas por categoría (típicamente salida de CE-01)',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo de cálculo de demanda diversificada',
        description: 'Aplicación de factores de demanda a loads residenciales',
        value: {
          cargas_por_categoria: [
            {
              category: 'lighting_general',
              carga_va: 1453.5,
              description: 'Iluminación general de todos los environments',
            },
            {
              category: 'tomas_generales',
              carga_va: 800.0,
              description: 'Tomacorrientes generales',
            },
            {
              category: 'electrodomesticos',
              carga_va: 1473.7,
              description: 'Nevera, microondas, lavadora, TV',
            },
            {
              category: 'climatizacion',
              carga_va: 1222.2,
              description: 'Aires acondicionados',
            },
          ],
          totales: {
            carga_total_va: 4949.4,
            voltage_v: 120,
            phases: 1,
          },
          observaciones: [
            'loads calculadas desde CE-01',
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

