import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protection, BreakerType, DifferentialType } from '../entities/protection.entity';
import { Circuit } from '../entities/circuit.entity';
import { CreateProtectionDto, UpdateProtectionDto, ProtectionResponseDto, CircuitProtectionDto } from '../dtos/protection.dto';

@Injectable()
export class ProtectionService {
  private readonly logger = new Logger(ProtectionService.name);

  // Valores estándar de breakers según normativa
  private readonly standardBreakers = [15, 20, 25, 30, 40, 50, 60];

  // Reglas de ampacidad por calibre (mm²) a 60°C
  private readonly ampacityTable = {
    '1.5 mm2': 15,
    '2.0 mm2': 20,
    '3.5 mm2': 30,
    '5.5 mm2': 50,
    '8.0 mm2': 70
  };

  // Reglas de diferenciales por tipo de área
  private readonly differentialRules = {
    GFCI_required_areas: ['banio', 'cocina', 'lavanderia', 'exteriores'],
    AFCI_susceptible_areas: ['dormitorio', 'estudio', 'sala']
  };

  constructor(
    @InjectRepository(Protection)
    private protectionRepository: Repository<Protection>,
    @InjectRepository(Circuit)
    private circuitRepository: Repository<Circuit>,
  ) {}

  /**
   * Obtiene la protección de un circuito específico
   */
  async getProtectionByCircuitId(circuitId: number): Promise<ProtectionResponseDto> {
    const protection = await this.protectionRepository.findOne({
      where: { circuitId },
      relations: ['circuit']
    });

    if (!protection) {
      throw new NotFoundException(`No se encontró protección para el circuito ${circuitId}`);
    }

    return this.mapToResponseDto(protection);
  }

  /**
   * Obtiene todas las protecciones de un proyecto
   */
  async getProtectionsByProjectId(projectId: number): Promise<CircuitProtectionDto[]> {
    const circuits = await this.circuitRepository.find({
      where: { projectId },
      relations: ['protections']
    });

    return circuits.map(circuit => ({
      id: circuit.id,
      loadVA: circuit.loadVA,
      conductorGauge: circuit.conductorGauge,
      areaType: circuit.areaType,
      phase: circuit.phase,
      voltage: circuit.voltage,
      currentA: circuit.currentA,
      protection: circuit.protections?.[0] ? this.mapToResponseDto(circuit.protections[0]) : undefined
    }));
  }

  /**
   * Recalcula todas las protecciones de un proyecto
   */
  async recalculateProtections(projectId: number): Promise<ProtectionResponseDto[]> {
    this.logger.log(`Recalculando protecciones para el proyecto ${projectId}`);

    const circuits = await this.circuitRepository.find({
      where: { projectId }
    });

    if (circuits.length === 0) {
      throw new NotFoundException(`No se encontraron circuitos para el proyecto ${projectId}`);
    }

    const protections: ProtectionResponseDto[] = [];

    for (const circuit of circuits) {
      const protection = await this.calculateProtectionForCircuit(circuit);
      protections.push(protection);
    }

    this.logger.log(`Protecciones recalculadas: ${protections.length} circuitos`);
    return protections;
  }

  /**
   * Calcula la protección óptima para un circuito
   */
  private async calculateProtectionForCircuit(circuit: Circuit): Promise<ProtectionResponseDto> {
    // Calcular corriente del circuito
    const currentA = this.calculateCircuitCurrent(circuit.loadVA, circuit.voltage);
    
    // Obtener ampacidad del conductor
    const ampacityA = this.getConductorAmpacity(circuit.conductorGauge);
    
    // Seleccionar breaker apropiado
    const breakerAmp = this.selectBreaker(currentA, ampacityA);
    
    // Determinar tipo de diferencial
    const differentialType = this.determineDifferentialType(circuit.areaType);
    
    // Crear o actualizar protección
    const protectionData = {
      circuitId: circuit.id,
      breakerAmp,
      breakerType: BreakerType.MCB,
      differentialType,
      notes: this.generateProtectionNotes(circuit, breakerAmp, differentialType)
    };

    let protection = await this.protectionRepository.findOne({
      where: { circuitId: circuit.id }
    });

    if (protection) {
      // Actualizar protección existente
      Object.assign(protection, protectionData);
      protection = await this.protectionRepository.save(protection);
    } else {
      // Crear nueva protección
      protection = this.protectionRepository.create(protectionData);
      protection = await this.protectionRepository.save(protection);
    }

    return this.mapToResponseDto(protection);
  }

  /**
   * Calcula la corriente del circuito
   */
  private calculateCircuitCurrent(loadVA: number, voltage: number): number {
    return Math.ceil(loadVA / voltage);
  }

  /**
   * Obtiene la ampacidad del conductor
   */
  private getConductorAmpacity(conductorGauge: string): number {
    const ampacity = this.ampacityTable[conductorGauge];
    if (!ampacity) {
      throw new BadRequestException(`Calibre de conductor no soportado: ${conductorGauge}`);
    }
    return ampacity;
  }

  /**
   * Selecciona el breaker apropiado
   */
  private selectBreaker(currentA: number, ampacityA: number): number {
    // Buscar el breaker estándar más cercano que sea >= corriente y <= ampacidad
    for (const breaker of this.standardBreakers) {
      if (breaker >= currentA && breaker <= ampacityA) {
        return breaker;
      }
    }

    // Si no hay breaker estándar apropiado, usar el más cercano permitido por ampacidad
    const validBreakers = this.standardBreakers.filter(b => b <= ampacityA);
    if (validBreakers.length === 0) {
      throw new BadRequestException(`No se puede seleccionar breaker para corriente ${currentA}A y ampacidad ${ampacityA}A`);
    }

    // Retornar el breaker más cercano a la corriente
    return validBreakers.reduce((prev, curr) => 
      Math.abs(curr - currentA) < Math.abs(prev - currentA) ? curr : prev
    );
  }

  /**
   * Determina el tipo de diferencial según el área
   */
  private determineDifferentialType(areaType: string): DifferentialType {
    const normalizedAreaType = areaType.toLowerCase().trim();
    
    if (this.differentialRules.GFCI_required_areas.includes(normalizedAreaType)) {
      return DifferentialType.GFCI;
    }
    
    if (this.differentialRules.AFCI_susceptible_areas.includes(normalizedAreaType)) {
      return DifferentialType.AFCI;
    }
    
    return DifferentialType.NONE;
  }

  /**
   * Genera notas explicativas para la protección
   */
  private generateProtectionNotes(circuit: Circuit, breakerAmp: number, differentialType: DifferentialType): string {
    const notes: string[] = [];
    
    // Nota sobre selección de breaker
    const currentA = this.calculateCircuitCurrent(circuit.loadVA, circuit.voltage);
    if (breakerAmp > currentA * 1.25) {
      notes.push(`Breaker ${breakerAmp}A seleccionado con margen de seguridad`);
    }
    
    // Nota sobre diferencial
    if (differentialType === DifferentialType.GFCI) {
      notes.push('GFCI requerido por normativa para área de riesgo');
    } else if (differentialType === DifferentialType.AFCI) {
      notes.push('AFCI recomendado para protección contra arcos eléctricos');
    }
    
    return notes.join('; ');
  }

  /**
   * Mapea la entidad a DTO de respuesta
   */
  private mapToResponseDto(protection: Protection): ProtectionResponseDto {
    return {
      id: protection.id,
      circuitId: protection.circuitId,
      breakerAmp: protection.breakerAmp,
      breakerType: protection.breakerType,
      differentialType: protection.differentialType,
      notes: protection.notes,
      createdAt: protection.createdAt,
      updatedAt: protection.updatedAt
    };
  }

  /**
   * Crea una nueva protección
   */
  async createProtection(createProtectionDto: CreateProtectionDto): Promise<ProtectionResponseDto> {
    const protection = this.protectionRepository.create(createProtectionDto);
    const savedProtection = await this.protectionRepository.save(protection);
    return this.mapToResponseDto(savedProtection);
  }

  /**
   * Actualiza una protección existente
   */
  async updateProtection(id: number, updateProtectionDto: UpdateProtectionDto): Promise<ProtectionResponseDto> {
    const protection = await this.protectionRepository.findOne({ where: { id } });
    
    if (!protection) {
      throw new NotFoundException(`Protección con ID ${id} no encontrada`);
    }

    Object.assign(protection, updateProtectionDto);
    const updatedProtection = await this.protectionRepository.save(protection);
    return this.mapToResponseDto(updatedProtection);
  }

  /**
   * Elimina una protección
   */
  async deleteProtection(id: number): Promise<void> {
    const protection = await this.protectionRepository.findOne({ where: { id } });
    
    if (!protection) {
      throw new NotFoundException(`Protección con ID ${id} no encontrada`);
    }

    await this.protectionRepository.remove(protection);
  }
}
