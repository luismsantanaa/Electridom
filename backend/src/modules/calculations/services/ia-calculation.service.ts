import { Injectable, Logger, BadRequestException, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Circuit } from '../entities/circuit.entity';
import { Protection } from '../entities/protection.entity';

export interface IASuperficie {
  nombre: string;
  area_m2: number;
}

export interface IAConsumo {
  equipo: string;
  ambiente: string;
  w: number;
}

export interface IACalculationRequest {
  projectId: number;
  inputs: {
    superficies: IASuperficie[];
    consumos: IAConsumo[];
  };
}

export interface IACircuit {
  id?: number;
  area: string;
  loadVA: number;
  conductorGauge: string;
  areaType: string;
  phase: number;
  voltage: number;
  currentA: number;
}

export interface IAProtection {
  circuitId: number;
  breakerAmp: number;
  differential: string;
  breakerType: string;
}

export interface IACalculationResponse {
  projectId: number;
  circuits: IACircuit[];
  protections: IAProtection[];
  explanations: string[];
  metadata: {
    model: string;
    timestamp: string;
    processingTime: number;
  };
}

export interface IAConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  parameters: {
    temperature: number;
    top_p: number;
    max_tokens: number;
  };
  timeouts_ms: {
    request: number;
  };
  retry: {
    maxAttempts: number;
    backoffMs: number;
  };
}

@Injectable()
export class IACalculationService {
  private readonly logger = new Logger(IACalculationService.name);
  private readonly iaConfig: IAConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(Circuit) private circuitRepository: Repository<Circuit>,
    @InjectRepository(Protection) private protectionRepository: Repository<Protection>,
  ) {
    this.iaConfig = {
      endpoint: this.configService.get<string>('IA_ENDPOINT', 'http://localhost:11434/api/generate'),
      apiKey: this.configService.get<string>('IA_API_KEY', ''),
      model: this.configService.get<string>('IA_MODEL', 'electridom-v1'),
      parameters: {
        temperature: this.configService.get<number>('IA_TEMPERATURE', 0.2),
        top_p: this.configService.get<number>('IA_TOP_P', 0.9),
        max_tokens: this.configService.get<number>('IA_MAX_TOKENS', 1200),
      },
      timeouts_ms: {
        request: this.configService.get<number>('IA_TIMEOUT_MS', 20000),
      },
      retry: {
        maxAttempts: this.configService.get<number>('IA_RETRY_MAX_ATTEMPTS', 2),
        backoffMs: this.configService.get<number>('IA_RETRY_BACKOFF_MS', 1500),
      },
    };
  }

  /**
   * Calcula circuitos y protecciones usando IA
   */
  async calculateWithIA(request: IACalculationRequest): Promise<IACalculationResponse> {
    const startTime = Date.now();
    this.logger.log(`Iniciando cálculo IA para proyecto ${request.projectId}`);

    try {
      // Validar entrada
      this.validateRequest(request);

      // Generar prompt para IA
      const prompt = this.generatePrompt(request.inputs);

      // Llamar a la IA
      const iaResponse = await this.callIA(prompt);

      // Normalizar respuesta
      const normalizedResponse = this.normalizeIAResponse(iaResponse, request.projectId);

      // Persistir resultados
      await this.persistResults(normalizedResponse, request.projectId);

      const processingTime = Date.now() - startTime;

      const response: IACalculationResponse = {
        projectId: request.projectId,
        circuits: normalizedResponse.circuits,
        protections: normalizedResponse.protections,
        explanations: normalizedResponse.explanations,
        metadata: {
          model: this.iaConfig.model,
          timestamp: new Date().toISOString(),
          processingTime,
        },
      };

      this.logger.log(`Cálculo IA completado en ${processingTime}ms para proyecto ${request.projectId}`);
      return response;

    } catch (error) {
      this.logger.error(`Error en cálculo IA para proyecto ${request.projectId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el último resultado de IA para un proyecto
   */
  async getLastIAResult(projectId: number): Promise<IACalculationResponse | null> {
    try {
      const circuits = await this.circuitRepository.find({
        where: { projectId },
        relations: ['protections'],
        order: { createdAt: 'DESC' },
      });

      if (circuits.length === 0) {
        return null;
      }

      const protections = await this.protectionRepository.find({
        where: { circuitId: circuits[0].id },
        order: { createdAt: 'DESC' },
      });

      const response: IACalculationResponse = {
        projectId,
        circuits: circuits.map(circuit => ({
          id: circuit.id,
          area: circuit.areaType,
          loadVA: circuit.loadVA,
          conductorGauge: circuit.conductorGauge,
          areaType: circuit.areaType,
          phase: circuit.phase,
          voltage: circuit.voltage,
          currentA: Number(circuit.currentA),
        })),
        protections: protections.map(protection => ({
          circuitId: protection.circuitId,
          breakerAmp: protection.breakerAmp,
          differential: protection.differentialType,
          breakerType: protection.breakerType,
        })),
        explanations: ['Resultado recuperado de la base de datos'],
        metadata: {
          model: this.iaConfig.model,
          timestamp: circuits[0].createdAt.toISOString(),
          processingTime: 0,
        },
      };

      return response;

    } catch (error) {
      this.logger.error(`Error obteniendo último resultado IA para proyecto ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Valida la solicitud de entrada
   */
  private validateRequest(request: IACalculationRequest): void {
    if (!request.projectId || request.projectId <= 0) {
      throw new BadRequestException('ID de proyecto inválido');
    }

    if (!request.inputs.superficies || request.inputs.superficies.length === 0) {
      throw new BadRequestException('Se requieren superficies para el cálculo');
    }

    if (!request.inputs.consumos || request.inputs.consumos.length === 0) {
      throw new BadRequestException('Se requieren consumos para el cálculo');
    }

    // Validar que las áreas de superficies coincidan con los ambientes de consumos
    const superficiesAreas = new Set(request.inputs.superficies.map(s => s.nombre.toLowerCase()));
    const consumosAmbientes = new Set(request.inputs.consumos.map(c => c.ambiente.toLowerCase()));

    const areasNoCoinciden = Array.from(consumosAmbientes).filter(ambiente => !superficiesAreas.has(ambiente));
    if (areasNoCoinciden.length > 0) {
      throw new BadRequestException(`Los ambientes de consumos no coinciden con las superficies: ${areasNoCoinciden.join(', ')}`);
    }
  }

  /**
   * Genera el prompt para la IA
   */
  private generatePrompt(inputs: { superficies: IASuperficie[]; consumos: IAConsumo[] }): string {
    const superficiesText = inputs.superficies
      .map(s => `- ${s.nombre}: ${s.area_m2} m²`)
      .join('\n');

    const consumosText = inputs.consumos
      .map(c => `- ${c.equipo} en ${c.ambiente}: ${c.w} W`)
      .join('\n');

    return `
# Cálculo Eléctrico Automático - Eléctridom

## Superficies del Proyecto:
${superficiesText}

## Consumos Eléctricos:
${consumosText}

## Instrucciones:
1. Calcula la carga total por área/ambiente
2. Asigna circuitos según la capacidad de carga (máximo 1800 VA por circuito residencial)
3. Selecciona conductores apropiados según la corriente calculada
4. Determina protecciones (breakers) según la corriente del circuito
5. Aplica reglas de diferenciales según el tipo de área (GFCI para baños, cocina, exteriores; AFCI para dormitorios)

## Formato de Respuesta JSON:
{
  "circuits": [
    {
      "area": "nombre del área",
      "loadVA": carga en VA,
      "conductorGauge": "calibre del conductor",
      "areaType": "tipo de área",
      "phase": 1,
      "voltage": 120,
      "currentA": corriente calculada
    }
  ],
  "protections": [
    {
      "circuitId": "ID del circuito (índice + 1)",
      "breakerAmp": amperaje del breaker,
      "differential": "GFCI|AFCI|NONE",
      "breakerType": "MCB"
    }
  ],
  "explanations": [
    "Explicación de las decisiones tomadas"
  ]
}

Responde SOLO con el JSON válido, sin texto adicional.
`;
  }

  /**
   * Llama a la IA externa
   */
  private async callIA(prompt: string): Promise<any> {
    try {
      const requestBody = {
        model: this.iaConfig.model,
        prompt,
        stream: false,
        options: {
          temperature: this.iaConfig.parameters.temperature,
          top_p: this.iaConfig.parameters.top_p,
          max_tokens: this.iaConfig.parameters.max_tokens,
        },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.iaConfig.apiKey) {
        headers['Authorization'] = `Bearer ${this.iaConfig.apiKey}`;
      }

      this.logger.log(`Llamando a IA en ${this.iaConfig.endpoint}`);

      const response = await firstValueFrom(
        this.httpService.post(this.iaConfig.endpoint, requestBody, { headers })
          .pipe(
            timeout(this.iaConfig.timeouts_ms.request),
            retry({
              count: this.iaConfig.retry.maxAttempts,
              delay: this.iaConfig.retry.backoffMs,
            }),
            catchError((error) => {
              this.logger.error('Error en llamada a IA:', error);
              if (error.code === 'ECONNABORTED') {
                throw new RequestTimeoutException('Timeout en llamada a IA');
              }
              throw new BadRequestException('Error en comunicación con IA');
            }),
          )
      );

      return response.data;

    } catch (error) {
      this.logger.error('Error en llamada a IA:', error);
      throw error;
    }
  }

  /**
   * Normaliza la respuesta de la IA
   */
  private normalizeIAResponse(iaResponse: any, projectId: number): {
    circuits: IACircuit[];
    protections: IAProtection[];
    explanations: string[];
  } {
    try {
      // Extraer el JSON de la respuesta de la IA
      let jsonResponse: any;
      
      if (iaResponse.response) {
        // Para Ollama
        jsonResponse = JSON.parse(iaResponse.response);
      } else if (iaResponse.choices && iaResponse.choices[0] && iaResponse.choices[0].message) {
        // Para OpenAI
        jsonResponse = JSON.parse(iaResponse.choices[0].message.content);
      } else {
        throw new Error('Formato de respuesta de IA no reconocido');
      }

      // Validar estructura básica
      if (!jsonResponse.circuits || !jsonResponse.protections) {
        throw new Error('Respuesta de IA incompleta: faltan circuits o protections');
      }

      // Normalizar circuitos
      const circuits: IACircuit[] = jsonResponse.circuits.map((circuit: any, index: number) => ({
        area: circuit.area || `Área ${index + 1}`,
        loadVA: circuit.loadVA || 0,
        conductorGauge: circuit.conductorGauge || '2.0 mm2',
        areaType: circuit.areaType || circuit.area || 'general',
        phase: circuit.phase || 1,
        voltage: circuit.voltage || 120,
        currentA: circuit.currentA || (circuit.loadVA / (circuit.voltage || 120)),
      }));

      // Normalizar protecciones
      const protections: IAProtection[] = jsonResponse.protections.map((protection: any) => ({
        circuitId: protection.circuitId || 1,
        breakerAmp: protection.breakerAmp || 20,
        differential: protection.differential || 'NONE',
        breakerType: protection.breakerType || 'MCB',
      }));

      // Normalizar explicaciones
      const explanations = jsonResponse.explanations || ['Cálculo realizado por IA'];

      return { circuits, protections, explanations };

    } catch (error) {
      this.logger.error('Error normalizando respuesta de IA:', error);
      throw new BadRequestException('Respuesta de IA inválida o malformada');
    }
  }

  /**
   * Persiste los resultados en la base de datos
   */
  private async persistResults(
    normalizedResponse: { circuits: IACircuit[]; protections: IAProtection[]; explanations: string[] },
    projectId: number,
  ): Promise<void> {
    try {
      // Crear circuitos
      const savedCircuits: Circuit[] = [];
      for (const circuitData of normalizedResponse.circuits) {
        const circuit = this.circuitRepository.create({
          projectId,
          loadVA: circuitData.loadVA,
          conductorGauge: circuitData.conductorGauge,
          areaType: circuitData.areaType,
          phase: circuitData.phase,
          voltage: circuitData.voltage,
          currentA: circuitData.currentA,
          notes: `Generado por IA - ${circuitData.area}`,
        });
        
        const savedCircuit = await this.circuitRepository.save(circuit);
        savedCircuits.push(savedCircuit);
      }

      // Crear protecciones
      for (const protectionData of normalizedResponse.protections) {
        const circuit = savedCircuits.find(c => c.id === protectionData.circuitId);
        if (circuit) {
          const protection = this.protectionRepository.create({
            circuitId: circuit.id,
            breakerAmp: protectionData.breakerAmp,
            breakerType: protectionData.breakerType as any,
            differentialType: protectionData.differential as any,
            notes: `Protección generada por IA para ${circuit.areaType}`,
          });
          
          await this.protectionRepository.save(protection);
        }
      }

      this.logger.log(`Resultados IA persistidos para proyecto ${projectId}: ${savedCircuits.length} circuitos creados`);
    } catch (error) {
      this.logger.error(`Error persistiendo resultados IA para proyecto ${projectId}:`, error);
      throw new BadRequestException('Error guardando resultados de IA');
    }
  }

  /**
   * Obtiene la configuración actual de IA
   */
  getIAConfig(): IAConfig {
    return { ...this.iaConfig };
  }
}
