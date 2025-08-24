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
    description: 'Calcula las loads eléctricas por environment basado en surfaces y consumptions definidos',
  })
  @ApiBody({
    type: CalcRoomsRequestDto,
    description: 'Datos de surfaces y consumptions para el cálculo',
    examples: {
      ejemplo1: {
        summary: 'Ejemplo de cálculo residencial',
        description: 'Cálculo para una vivienda con sala, cocina, habitación y baño',
        value: {
          system: {
            voltage: 120,
            phases: 1,
            frequency: 60
          },
          surfaces: [
            { name: "Sala", area_m2: 18 },
            { name: "Cocina", area_m2: 12 },
            { name: "Habitación 1", area_m2: 12 },
            { name: "Baño", area_m2: 5 }
          ],
          consumptions: [
            {
              name: "Nevera",
              environment: "Cocina",
              power_w: 200,
              type: "electrodomestico",
              fp: 0.95
            },
            {
              name: "Microondas",
              environment: "Cocina",
              power_w: 1200,
              type: "electrodomestico",
              fp: 0.95
            },
            {
              name: "TV",
              environment: "Sala",
              power_w: 140,
              type: "electrodomestico"
            },
            {
              name: "A/C 12k BTU",
              environment: "Habitación 1",
              power_w: 1100,
              type: "climatizacion",
              fp: 0.9
            },
            {
              name: "Lavadora",
              environment: "Baño",
              power_w: 500,
              type: "electrodomestico",
              fp: 0.9
            }
          ]
        }
      }
    }
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
  async calculateRooms(@Body() request: CalcRoomsRequestDto): Promise<CalcRoomsResponseDto> {
    return this.calcEngineService.calcByRoom(request);
  }
}

