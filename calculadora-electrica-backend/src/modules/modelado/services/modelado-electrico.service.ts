import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  Proyecto, 
  Ambiente, 
  Carga, 
  Circuito, 
  Proteccion, 
  Conductor,
  NormativaAmpacidad,
  NormativaBreaker
} from '../entities';
import { GenerarCircuitosDto, ResultadoModeladoDto } from '../dto';

@Injectable()
export class ModeladoElectricoService {
  private readonly logger = new Logger(ModeladoElectricoService.name);

  constructor(
    @InjectRepository(Proyecto)
    private readonly proyectoRepository: Repository<Proyecto>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
    @InjectRepository(Carga)
    private readonly cargaRepository: Repository<Carga>,
    @InjectRepository(Circuito)
    private readonly circuitoRepository: Repository<Circuito>,
    @InjectRepository(Proteccion)
    private readonly proteccionRepository: Repository<Proteccion>,
    @InjectRepository(Conductor)
    private readonly conductorRepository: Repository<Conductor>,
    @InjectRepository(NormativaAmpacidad)
    private readonly normativaAmpacidadRepository: Repository<NormativaAmpacidad>,
    @InjectRepository(NormativaBreaker)
    private readonly normativaBreakerRepository: Repository<NormativaBreaker>,
  ) {}

  /**
   * Genera circuitos eléctricos para un proyecto completo
   */
  async generarCircuitos(dto: GenerarCircuitosDto): Promise<ResultadoModeladoDto> {
    this.logger.log(`Generando circuitos para proyecto ${dto.proyecto_id}`);

    // Verificar que el proyecto existe
    const proyecto = await this.proyectoRepository.findOne({
      where: { id: dto.proyecto_id },
      relations: ['ambientes', 'ambientes.cargas']
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto con ID ${dto.proyecto_id} no encontrado`);
    }

    // Configurar parámetros por defecto
    const tensionSistema = dto.tension_sistema || proyecto.tension_sistema || '120V';
    const fases = dto.fases || proyecto.fases || 1;
    const factorPotencia = dto.factor_potencia || proyecto.factor_potencia || 0.9;
    const materialConductor = dto.material_conductor || 'Cu';
    const tipoAislamiento = dto.tipo_aislamiento || 'THHN';
    const temperaturaAmbiente = dto.temperatura_ambiente || 30;

    // Limpiar circuitos existentes del proyecto
    await this.limpiarCircuitosExistentes(dto.proyecto_id);

    const circuitosGenerados = [];

    // Procesar cada ambiente
    for (const ambiente of proyecto.ambientes) {
      const circuitosAmbiente = await this.generarCircuitosPorAmbiente(
        ambiente,
        tensionSistema,
        fases,
        factorPotencia,
        materialConductor,
        tipoAislamiento,
        temperaturaAmbiente
      );
      circuitosGenerados.push(...circuitosAmbiente);
    }

    // Calcular totales
    const totalCircuitos = circuitosGenerados.length;
    const potenciaTotalVa = circuitosGenerados.reduce((sum, c) => sum + c.potencia_va, 0);
    const corrienteTotalA = circuitosGenerados.reduce((sum, c) => sum + Number(c.corriente_a), 0);

    // Construir respuesta
    const resultado: ResultadoModeladoDto = {
      proyecto_id: proyecto.id,
      proyecto_nombre: proyecto.nombre,
      tension_sistema: tensionSistema,
      fases: fases,
      factor_potencia: factorPotencia,
      circuitos: circuitosGenerados.map(circuito => ({
        id: circuito.id,
        ambiente_id: circuito.ambiente_id,
        tipo: circuito.tipo,
        potencia_va: circuito.potencia_va,
        corriente_a: Number(circuito.corriente_a),
        nombre: circuito.nombre,
        numero_circuito: circuito.numero_circuito,
        observaciones: circuito.observaciones,
        proteccion: circuito.protecciones[0] ? {
          id: circuito.protecciones[0].id,
          tipo: circuito.protecciones[0].tipo,
          capacidad_a: circuito.protecciones[0].capacidad_a,
          curva: circuito.protecciones[0].curva,
          marca: circuito.protecciones[0].marca,
          modelo: circuito.protecciones[0].modelo
        } : null,
        conductor: circuito.conductores[0] ? {
          id: circuito.conductores[0].id,
          calibre_awg: circuito.conductores[0].calibre_awg,
          material: circuito.conductores[0].material,
          capacidad_a: circuito.conductores[0].capacidad_a,
          tipo_aislamiento: circuito.conductores[0].tipo_aislamiento,
          longitud_m: circuito.conductores[0].longitud_m,
          caida_tension: circuito.conductores[0].caida_tension
        } : null
      })),
      total_circuitos: totalCircuitos,
      potencia_total_va: potenciaTotalVa,
      corriente_total_a: corrienteTotalA,
      fecha_generacion: new Date()
    };

    this.logger.log(`Generados ${totalCircuitos} circuitos para proyecto ${proyecto.id}`);
    return resultado;
  }

  /**
   * Genera circuitos para un ambiente específico
   */
  private async generarCircuitosPorAmbiente(
    ambiente: Ambiente,
    tensionSistema: string,
    fases: number,
    factorPotencia: number,
    materialConductor: string,
    tipoAislamiento: string,
    temperaturaAmbiente: number
  ): Promise<Circuito[]> {
    const circuitos = [];
    let numeroCircuito = 1;

    // Agrupar cargas por tipo
    const cargasPorTipo = this.agruparCargasPorTipo(ambiente.cargas);

    // Generar circuitos por tipo de carga
    for (const [tipoCarga, cargas] of Object.entries(cargasPorTipo)) {
      const circuitosTipo = await this.generarCircuitosPorTipo(
        ambiente,
        tipoCarga,
        cargas,
        tensionSistema,
        fases,
        factorPotencia,
        materialConductor,
        tipoAislamiento,
        temperaturaAmbiente,
        numeroCircuito
      );
      circuitos.push(...circuitosTipo);
      numeroCircuito += circuitosTipo.length;
    }

    return circuitos;
  }

  /**
   * Agrupa las cargas por tipo (IUG, TUG, IUE, TUE)
   */
  private agruparCargasPorTipo(cargas: Carga[]): Record<string, Carga[]> {
    const grupos = {};
    for (const carga of cargas) {
      if (!grupos[carga.tipo]) {
        grupos[carga.tipo] = [];
      }
      grupos[carga.tipo].push(carga);
    }
    return grupos;
  }

  /**
   * Genera circuitos para un tipo específico de carga
   */
  private async generarCircuitosPorTipo(
    ambiente: Ambiente,
    tipoCarga: string,
    cargas: Carga[],
    tensionSistema: string,
    fases: number,
    factorPotencia: number,
    materialConductor: string,
    tipoAislamiento: string,
    temperaturaAmbiente: number,
    numeroCircuitoInicial: number
  ): Promise<Circuito[]> {
    const circuitos = [];
    let numeroCircuito = numeroCircuitoInicial;

    // Calcular potencia total del tipo
    const potenciaTotalW = cargas.reduce((sum, carga) => sum + carga.potencia_w, 0);
    const potenciaTotalVa = potenciaTotalW / factorPotencia;

    // Calcular corriente
    const tensionV = this.extraerTension(tensionSistema);
    const corrienteA = (potenciaTotalVa * fases) / (tensionV * Math.sqrt(fases));

    // Crear circuito
    const circuito = await this.circuitoRepository.save({
      proyecto_id: ambiente.proyecto_id,
      ambiente_id: ambiente.id,
      tipo: tipoCarga,
      potencia_va: Math.round(potenciaTotalVa),
      corriente_a: Math.round(corrienteA * 100) / 100,
      nombre: `${tipoCarga} - ${ambiente.nombre}`,
      numero_circuito: numeroCircuito,
      observaciones: `Circuito ${tipoCarga} para ${ambiente.nombre}`,
      factor_potencia: factorPotencia
    });

    // Asignar protección
    const proteccion = await this.asignarProteccion(circuito, corrienteA);
    await this.proteccionRepository.save(proteccion);

    // Asignar conductor
    const conductor = await this.asignarConductor(
      circuito, 
      corrienteA, 
      materialConductor, 
      tipoAislamiento, 
      temperaturaAmbiente
    );
    await this.conductorRepository.save(conductor);

    // Cargar relaciones para la respuesta
    const circuitoCompleto = await this.circuitoRepository.findOne({
      where: { id: circuito.id },
      relations: ['protecciones', 'conductores']
    });

    circuitos.push(circuitoCompleto);
    return circuitos;
  }

  /**
   * Extrae el valor numérico de la tensión del sistema
   */
  private extraerTension(tensionSistema: string): number {
    const match = tensionSistema.match(/(\d+)/);
    return match ? parseInt(match[1]) : 120;
  }

  /**
   * Asigna una protección adecuada para el circuito
   */
  private async asignarProteccion(circuito: Circuito, corrienteA: number): Promise<Partial<Proteccion>> {
    // Buscar breaker con capacidad igual o mayor a la corriente calculada
    const breaker = await this.normativaBreakerRepository.findOne({
      where: { capacidad_a: corrienteA },
      order: { capacidad_a: 'ASC' }
    });

    if (!breaker) {
      // Si no encuentra exacto, buscar el siguiente disponible
      const breakerSiguiente = await this.normativaBreakerRepository.findOne({
        where: { capacidad_a: corrienteA + 1 },
        order: { capacidad_a: 'ASC' }
      });

      if (breakerSiguiente) {
        return {
          circuito_id: circuito.id,
          tipo: 'MCB',
          capacidad_a: breakerSiguiente.capacidad_a,
          curva: breakerSiguiente.curva || 'C',
          descripcion: `MCB ${breakerSiguiente.capacidad_a}A curva ${breakerSiguiente.curva || 'C'}`
        };
      }
    }

    // Usar breaker encontrado o valores por defecto
    return {
      circuito_id: circuito.id,
      tipo: 'MCB',
      capacidad_a: breaker?.capacidad_a || Math.ceil(corrienteA),
      curva: breaker?.curva || 'C',
      descripcion: `MCB ${breaker?.capacidad_a || Math.ceil(corrienteA)}A curva ${breaker?.curva || 'C'}`
    };
  }

  /**
   * Asigna un conductor adecuado para el circuito
   */
  private async asignarConductor(
    circuito: Circuito,
    corrienteA: number,
    material: string,
    tipoAislamiento: string,
    temperaturaAmbiente: number
  ): Promise<Partial<Conductor>> {
    // Buscar conductor con capacidad igual o mayor a la corriente calculada
    const conductor = await this.normativaAmpacidadRepository.findOne({
      where: { 
        material: material,
        capacidad_a: corrienteA 
      },
      order: { capacidad_a: 'ASC' }
    });

    if (!conductor) {
      // Si no encuentra exacto, buscar el siguiente disponible
      const conductorSiguiente = await this.normativaAmpacidadRepository.findOne({
        where: { 
          material: material,
          capacidad_a: corrienteA + 1 
        },
        order: { capacidad_a: 'ASC' }
      });

      if (conductorSiguiente) {
        return {
          circuito_id: circuito.id,
          calibre_awg: conductorSiguiente.calibre_awg,
          material: conductorSiguiente.material,
          capacidad_a: conductorSiguiente.capacidad_a,
          tipo_aislamiento: tipoAislamiento,
          descripcion: `${conductorSiguiente.calibre_awg} AWG ${conductorSiguiente.material} ${tipoAislamiento}`
        };
      }
    }

    // Usar conductor encontrado o valores por defecto
    const calibreDefault = this.calcularCalibreDefault(corrienteA);
    return {
      circuito_id: circuito.id,
      calibre_awg: conductor?.calibre_awg || calibreDefault,
      material: conductor?.material || material,
      capacidad_a: conductor?.capacidad_a || Math.ceil(corrienteA),
      tipo_aislamiento: tipoAislamiento,
      descripcion: `${conductor?.calibre_awg || calibreDefault} AWG ${conductor?.material || material} ${tipoAislamiento}`
    };
  }

  /**
   * Calcula el calibre por defecto basado en la corriente
   */
  private calcularCalibreDefault(corrienteA: number): string {
    if (corrienteA <= 15) return '14';
    if (corrienteA <= 20) return '12';
    if (corrienteA <= 30) return '10';
    if (corrienteA <= 40) return '8';
    if (corrienteA <= 55) return '6';
    if (corrienteA <= 75) return '4';
    if (corrienteA <= 100) return '3';
    if (corrienteA <= 130) return '2';
    if (corrienteA <= 175) return '1';
    return '1/0';
  }

  /**
   * Limpia los circuitos existentes de un proyecto
   */
  private async limpiarCircuitosExistentes(proyectoId: number): Promise<void> {
    // Eliminar conductores y protecciones primero (por las foreign keys)
    const circuitos = await this.circuitoRepository.find({
      where: { proyecto_id: proyectoId }
    });

    for (const circuito of circuitos) {
      await this.conductorRepository.delete({ circuito_id: circuito.id });
      await this.proteccionRepository.delete({ circuito_id: circuito.id });
    }

    // Eliminar circuitos
    await this.circuitoRepository.delete({ proyecto_id: proyectoId });
  }

  /**
   * Obtiene los resultados del modelado para un proyecto
   */
  async obtenerResultados(proyectoId: number): Promise<ResultadoModeladoDto> {
    const proyecto = await this.proyectoRepository.findOne({
      where: { id: proyectoId },
      relations: ['circuitos', 'circuitos.protecciones', 'circuitos.conductores', 'circuitos.ambiente']
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto con ID ${proyectoId} no encontrado`);
    }

    if (!proyecto.circuitos || proyecto.circuitos.length === 0) {
      throw new NotFoundException(`No hay circuitos generados para el proyecto ${proyectoId}`);
    }

    const totalCircuitos = proyecto.circuitos.length;
    const potenciaTotalVa = proyecto.circuitos.reduce((sum, c) => sum + c.potencia_va, 0);
    const corrienteTotalA = proyecto.circuitos.reduce((sum, c) => sum + Number(c.corriente_a), 0);

    return {
      proyecto_id: proyecto.id,
      proyecto_nombre: proyecto.nombre,
      tension_sistema: proyecto.tension_sistema || '120V',
      fases: proyecto.fases || 1,
      factor_potencia: proyecto.factor_potencia || 0.9,
      circuitos: proyecto.circuitos.map(circuito => ({
        id: circuito.id,
        ambiente_id: circuito.ambiente_id,
        tipo: circuito.tipo,
        potencia_va: circuito.potencia_va,
        corriente_a: Number(circuito.corriente_a),
        nombre: circuito.nombre,
        numero_circuito: circuito.numero_circuito,
        observaciones: circuito.observaciones,
        proteccion: circuito.protecciones[0] ? {
          id: circuito.protecciones[0].id,
          tipo: circuito.protecciones[0].tipo,
          capacidad_a: circuito.protecciones[0].capacidad_a,
          curva: circuito.protecciones[0].curva,
          marca: circuito.protecciones[0].marca,
          modelo: circuito.protecciones[0].modelo
        } : null,
        conductor: circuito.conductores[0] ? {
          id: circuito.conductores[0].id,
          calibre_awg: circuito.conductores[0].calibre_awg,
          material: circuito.conductores[0].material,
          capacidad_a: circuito.conductores[0].capacidad_a,
          tipo_aislamiento: circuito.conductores[0].tipo_aislamiento,
          longitud_m: circuito.conductores[0].longitud_m,
          caida_tension: circuito.conductores[0].caida_tension
        } : null
      })),
      total_circuitos: totalCircuitos,
      potencia_total_va: potenciaTotalVa,
      corriente_total_a: corrienteTotalA,
      fecha_generacion: new Date()
    };
  }
}
