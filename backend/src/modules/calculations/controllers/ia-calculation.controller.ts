import { Controller, Post, Get, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { IACalculationService, IACalculationRequest, IACalculationResponse } from '../services/ia-calculation.service';

@ApiTags('Cálculos con IA')
@Controller('api/ia')
export class IACalculationController {
  constructor(private readonly iaCalculationService: IACalculationService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular circuitos y protecciones usando IA',
    description: 'Utiliza inteligencia artificial para calcular automáticamente la asignación de circuitos y protecciones basándose en superficies y consumos del proyecto.'
  })
  @ApiBody({
    description: 'Datos del proyecto y entradas para el cálculo IA',
    type: 'object',
    schema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'number',
          description: 'ID del proyecto',
          example: 123
        },
        inputs: {
          type: 'object',
          properties: {
            superficies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nombre: { type: 'string', example: 'Sala' },
                  area_m2: { type: 'number', example: 18 }
                }
              },
              example: [{ nombre: 'Sala', area_m2: 18 }]
            },
            consumos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  equipo: { type: 'string', example: 'Nevera' },
                  ambiente: { type: 'string', example: 'Cocina' },
                  w: { type: 'number', example: 300 }
                }
              },
              example: [{ equipo: 'Nevera', ambiente: 'Cocina', w: 300 }]
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Cálculo IA completado exitosamente',
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number' },
        circuits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              area: { type: 'string' },
              loadVA: { type: 'number' },
              conductorGauge: { type: 'string' },
              areaType: { type: 'string' },
              phase: { type: 'number' },
              voltage: { type: 'number' },
              currentA: { type: 'number' }
            }
          }
        },
        protections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              circuitId: { type: 'number' },
              breakerAmp: { type: 'number' },
              differential: { type: 'string' },
              breakerType: { type: 'string' }
            }
          }
        },
        explanations: {
          type: 'array',
          items: { type: 'string' }
        },
        metadata: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            timestamp: { type: 'string' },
            processingTime: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o error en el cálculo'
  })
  @ApiResponse({
    status: 408,
    description: 'Timeout en la comunicación con la IA'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async calculateWithIA(@Body() request: IACalculationRequest): Promise<IACalculationResponse> {
    return this.iaCalculationService.calculateWithIA(request);
  }

  @Get('result/:projectId')
  @ApiOperation({
    summary: 'Obtener último resultado de IA para un proyecto',
    description: 'Recupera el último cálculo realizado por IA para el proyecto especificado, incluyendo circuitos y protecciones generados.'
  })
  @ApiParam({
    name: 'projectId',
    description: 'ID del proyecto',
    type: 'number',
    example: 123
  })
  @ApiResponse({
    status: 200,
    description: 'Último resultado de IA encontrado',
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'number' },
        circuits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              area: { type: 'string' },
              loadVA: { type: 'number' },
              conductorGauge: { type: 'string' },
              areaType: { type: 'string' },
              phase: { type: 'number' },
              voltage: { type: 'number' },
              currentA: { type: 'number' }
            }
          }
        },
        protections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              circuitId: { type: 'number' },
              breakerAmp: { type: 'number' },
              differential: { type: 'string' },
              breakerType: { type: 'string' }
            }
          }
        },
        explanations: {
          type: 'array',
          items: { type: 'string' }
        },
        metadata: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            timestamp: { type: 'string' },
            processingTime: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron resultados de IA para el proyecto'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async getLastIAResult(@Param('projectId', ParseIntPipe) projectId: number): Promise<IACalculationResponse | null> {
    return this.iaCalculationService.getLastIAResult(projectId);
  }

  @Get('config')
  @ApiOperation({
    summary: 'Obtener configuración actual de IA',
    description: 'Retorna la configuración actual del servicio de IA, incluyendo endpoint, modelo y parámetros.'
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración de IA obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        endpoint: { type: 'string' },
        apiKey: { type: 'string' },
        model: { type: 'string' },
        parameters: {
          type: 'object',
          properties: {
            temperature: { type: 'number' },
            top_p: { type: 'number' },
            max_tokens: { type: 'number' }
          }
        },
        timeouts_ms: {
          type: 'object',
          properties: {
            request: { type: 'number' }
          }
        },
        retry: {
          type: 'object',
          properties: {
            maxAttempts: { type: 'number' },
            backoffMs: { type: 'number' }
          }
        }
      }
    }
  })
  getIAConfig() {
    return this.iaCalculationService.getIAConfig();
  }
}
