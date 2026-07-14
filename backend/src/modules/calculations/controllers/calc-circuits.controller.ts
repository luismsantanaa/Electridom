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
    summary: 'Agrupar loads en circuits ramales y seleccionar conductors',
    description:
      'Agrupa las loads diversificadas en circuits ramales respetando el 80% de utilización, selecciona breakers y conductors apropiados conforme ampacity',
  })
  @ApiBody({
    type: CalcCircuitsRequestDto,
    description: 'loads diversificadas (típicamente salida de CE-02)',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo de agrupación de circuits',
        description: 'Agrupación de loads residenciales en circuits ramales',
        value: {
          cargas_diversificadas: [
            {
              category: 'lighting_general',
              carga_diversificada_va: 1453.5,
              demand_factor: 1.0,
              description: 'Iluminación general de todos los environments',
              environment: 'General',
            },
            {
              category: 'tomas_generales',
              carga_diversificada_va: 800.0,
              demand_factor: 1.0,
              description: 'Tomacorrientes generales',
              environment: 'General',
            },
            {
              category: 'electrodomesticos',
              carga_diversificada_va: 1252.65,
              demand_factor: 0.85,
              description: 'Nevera, microondas, lavadora, TV',
              environment: 'Cocina/Lavandería',
            },
            {
              category: 'climatizacion',
              carga_diversificada_va: 1222.2,
              demand_factor: 1.0,
              description: 'Aires acondicionados',
              environment: 'Habitaciones',
            },
          ],
          system: {
            voltage_v: 120,
            phases: 1,
            system_type: 1,
            frequency: 60,
          },
          observaciones: [
            'loads diversificadas desde CE-02',
            'system residencial monofásico',
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
    description: 'circuits ramales generados exitosamente',
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
