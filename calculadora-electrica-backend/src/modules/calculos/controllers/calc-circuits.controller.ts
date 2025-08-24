import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CircuitService } from '../services/circuit.service';
import { CalcCircuitsRequestDto } from '../dtos/calc-circuits-request.dto';
import { CalcCircuitsResponseDto } from '../dtos/calc-circuits-response.dto';

@ApiTags('Cálculos Eléctricos')
@Controller('calc')
export class CalcCircuitsController {
  constructor(private readonly circuitService: CircuitService) {}

  @Post('circuits/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Agrupar cargas en circuitos ramales y seleccionar conductores',
    description:
      'Agrupa las cargas diversificadas en circuitos ramales respetando el 80% de utilización, selecciona breakers y conductores apropiados conforme ampacity',
  })
  @ApiBody({
    type: CalcCircuitsRequestDto,
    description: 'Cargas diversificadas (típicamente salida de CE-02)',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo de agrupación de circuitos',
        description: 'Agrupación de cargas residenciales en circuitos ramales',
        value: {
          cargas_diversificadas: [
            {
              categoria: 'lighting_general',
              carga_diversificada_va: 1453.5,
              factor_demanda: 1.0,
              descripcion: 'Iluminación general de todos los ambientes',
              ambiente: 'General',
            },
            {
              categoria: 'tomas_generales',
              carga_diversificada_va: 800.0,
              factor_demanda: 1.0,
              descripcion: 'Tomacorrientes generales',
              ambiente: 'General',
            },
            {
              categoria: 'electrodomesticos',
              carga_diversificada_va: 1252.65,
              factor_demanda: 0.85,
              descripcion: 'Nevera, microondas, lavadora, TV',
              ambiente: 'Cocina/Lavandería',
            },
            {
              categoria: 'climatizacion',
              carga_diversificada_va: 1222.2,
              factor_demanda: 1.0,
              descripcion: 'Aires acondicionados',
              ambiente: 'Habitaciones',
            },
          ],
          sistema: {
            tension_v: 120,
            phases: 1,
            system_type: 1,
            frequency: 60,
          },
          observaciones: [
            'Cargas diversificadas desde CE-02',
            'Sistema residencial monofásico',
          ],
          configuraciones: {
            max_utilizacion_circuito: 0.8,
            separar_por_ambiente: false,
            preferir_monofasico: true,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Circuitos ramales generados exitosamente',
    type: CalcCircuitsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async groupIntoCircuits(
    @Body() request: CalcCircuitsRequestDto,
  ): Promise<CalcCircuitsResponseDto> {
    return this.circuitService.groupIntoCircuits(request);
  }
}
