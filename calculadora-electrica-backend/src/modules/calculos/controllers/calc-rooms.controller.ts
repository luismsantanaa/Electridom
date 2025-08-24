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
    summary: 'Calcular cargas por ambiente',
    description: 'Calcula las cargas eléctricas por ambiente basado en superficies y consumos definidos',
  })
  @ApiBody({
    type: CalcRoomsRequestDto,
    description: 'Datos de superficies y consumos para el cálculo',
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
          superficies: [
            { nombre: "Sala", area_m2: 18 },
            { nombre: "Cocina", area_m2: 12 },
            { nombre: "Habitación 1", area_m2: 12 },
            { nombre: "Baño", area_m2: 5 }
          ],
          consumos: [
            {
              nombre: "Nevera",
              ambiente: "Cocina",
              potencia_w: 200,
              tipo: "electrodomestico",
              fp: 0.95
            },
            {
              nombre: "Microondas",
              ambiente: "Cocina",
              potencia_w: 1200,
              tipo: "electrodomestico",
              fp: 0.95
            },
            {
              nombre: "TV",
              ambiente: "Sala",
              potencia_w: 140,
              tipo: "electrodomestico"
            },
            {
              nombre: "A/C 12k BTU",
              ambiente: "Habitación 1",
              potencia_w: 1100,
              tipo: "climatizacion",
              fp: 0.9
            },
            {
              nombre: "Lavadora",
              ambiente: "Baño",
              potencia_w: 500,
              tipo: "electrodomestico",
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
