import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CalcEngineService } from '../services/calc-engine.service';
import { CalcRoomsRequestDto } from '../dtos/calc-rooms-request.dto';
import { CalcRoomsResponseDto } from '../dtos/calc-rooms-response.dto';

@ApiTags('Cálculos Eléctricos')
@Controller('calc')
export class CalcRoomsController {
  constructor(private readonly calcEngineService: CalcEngineService) {}

  @Post('rooms/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular loads por environment',
    description:
      'Calcula las loads eléctricas por environment basado en surfaces y consumptions definidos',
  })
  @ApiBody({
    type: CalcRoomsRequestDto,
    description: 'Datos de superficies y consumos para el cálculo',
    examples: {
      ejemplo_residencial: {
        summary: 'Ejemplo Residencial - Vivienda Familiar',
        description:
          'Cálculo para una vivienda típica con sala, cocina, habitaciones y baños',
        value: {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60,
          },
          superficies: [
            { nombre: 'Sala', area_m2: 18.5 },
            { nombre: 'Cocina', area_m2: 12.0 },
            { nombre: 'Habitación 1', area_m2: 12.0 },
            { nombre: 'Habitación 2', area_m2: 10.0 },
            { nombre: 'Baño Principal', area_m2: 6.0 },
            { nombre: 'Baño Secundario', area_m2: 4.5 },
          ],
          consumos: [
            {
              nombre: 'Refrigerador',
              ambiente: 'Cocina',
              potencia_w: 350,
              tipo: 'electrodomestico',
              fp: 0.85,
            },
            {
              nombre: 'Microondas',
              ambiente: 'Cocina',
              potencia_w: 1200,
              tipo: 'electrodomestico',
              fp: 0.95,
            },
            {
              nombre: 'Televisor LED',
              ambiente: 'Sala',
              potencia_w: 120,
              tipo: 'electrodomestico',
              fp: 0.9,
            },
            {
              nombre: 'Aire Acondicionado 12k BTU',
              ambiente: 'Habitación 1',
              potencia_w: 1100,
              tipo: 'climatizacion',
              fp: 0.9,
            },
            {
              nombre: 'Ventilador de Techo',
              ambiente: 'Habitación 2',
              potencia_w: 75,
              tipo: 'climatizacion',
              fp: 0.85,
            },
            {
              nombre: 'Lavadora',
              ambiente: 'Baño Principal',
              potencia_w: 500,
              tipo: 'electrodomestico',
              fp: 0.9,
            },
          ],
        },
      },
      ejemplo_comercial: {
        summary: 'Ejemplo Comercial - Oficina Pequeña',
        description:
          'Cálculo para una oficina con equipos de cómputo y climatización',
        value: {
          system: {
            voltage: 208,
            phases: 3,
            frequency: 60,
          },
          superficies: [
            { nombre: 'Oficina Principal', area_m2: 25.0 },
            { nombre: 'Sala de Reuniones', area_m2: 15.0 },
            { nombre: 'Área de Servicios', area_m2: 8.0 },
          ],
          consumos: [
            {
              nombre: 'Computadora Principal',
              ambiente: 'Oficina Principal',
              potencia_w: 400,
              tipo: 'especial',
              fp: 0.9,
            },
            {
              nombre: 'Monitor LED',
              ambiente: 'Oficina Principal',
              potencia_w: 50,
              tipo: 'especial',
              fp: 0.95,
            },
            {
              nombre: 'Aire Acondicionado',
              ambiente: 'Oficina Principal',
              potencia_w: 1800,
              tipo: 'climatizacion',
              fp: 0.85,
            },
            {
              nombre: 'Proyector',
              ambiente: 'Sala de Reuniones',
              potencia_w: 300,
              tipo: 'especial',
              fp: 0.9,
            },
            {
              nombre: 'Servidor',
              ambiente: 'Área de Servicios',
              potencia_w: 800,
              tipo: 'especial',
              fp: 0.9,
            },
          ],
        },
      },
      ejemplo_minimo: {
        summary: 'Ejemplo Mínimo - Habitación Simple',
        description: 'Cálculo básico para una habitación con cargas mínimas',
        value: {
          superficies: [{ nombre: 'Habitación', area_m2: 12.0 }],
          consumos: [
            {
              nombre: 'Lámpara LED',
              ambiente: 'Habitación',
              potencia_w: 15,
              tipo: 'iluminacion',
              fp: 0.95,
            },
            {
              nombre: 'Ventilador',
              ambiente: 'Habitación',
              potencia_w: 75,
              tipo: 'climatizacion',
              fp: 0.85,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cálculo completado exitosamente',
    type: CalcRoomsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async calculateRooms(
    @Body() request: CalcRoomsRequestDto,
  ): Promise<CalcRoomsResponseDto> {
    return this.calcEngineService.calcByRoom(request);
  }
}
