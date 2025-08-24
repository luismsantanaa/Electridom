import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoInstalacion } from '../../modules/tipos-instalaciones/entities/tipo-instalacion.entity';
import { TipoAmbiente } from '../../modules/tipos-ambientes/entities/tipo-ambiente.entity';
import { TipoArtefacto } from '../../modules/tipos-artefactos/entities/tipo-artefacto.entity';
import { NormConst } from '../../modules/calculos/entities/norm-const.entity';
import { DemandFactor } from '../../modules/calculos/entities/demand-factor.entity';
import { Ampacity } from '../../modules/calculos/entities/ampacity.entity';
import { BreakerCurve } from '../../modules/calculos/entities/breaker-curve.entity';
import { Resistivity } from '../../modules/calculos/entities/resistivity.entity';
import { GroundingRules } from '../../modules/calculos/entities/grounding-rules.entity';
import * as fs from 'fs';
import * as path from 'path';

interface TipoInstalacionSeed {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

interface TipoAmbienteSeed {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  tipoInstalacion_Id: number;
}

interface TipoArtefactoSeed {
  id: number;
  Nombre: string;
  descripcion?: string;
  activo: boolean;
  EspacioId: number;
  Potencia: number;
}

function getSeedFilePath(filename: string): string {
  const distPath = path.join(
    process.cwd(),
    'dist',
    'src',
    'database',
    'seeds',
    filename,
  );
  const srcPath = path.join(
    process.cwd(),
    'src',
    'database',
    'seeds',
    filename,
  );
  return fs.existsSync(distPath) ? distPath : srcPath;
}

const tiposInstalaciones = JSON.parse(
  fs.readFileSync(getSeedFilePath('TiposInstalacion.json'), 'utf-8'),
) as TipoInstalacionSeed[];

const tiposAmbientes = JSON.parse(
  fs.readFileSync(getSeedFilePath('TiposAmbientes.json'), 'utf-8'),
) as TipoAmbienteSeed[];

const tiposArtefactos = JSON.parse(
  fs.readFileSync(getSeedFilePath('TiposArtefactos.json'), 'utf-8'),
) as TipoArtefactoSeed[];

@Injectable()
export class SeedsService {
  constructor(
    @InjectRepository(TipoInstalacion)
    private readonly tipoInstalacionRepository: Repository<TipoInstalacion>,
    @InjectRepository(TipoAmbiente)
    private readonly tipoAmbienteRepository: Repository<TipoAmbiente>,
    @InjectRepository(TipoArtefacto)
    private readonly tipoArtefactoRepository: Repository<TipoArtefacto>,
    @InjectRepository(NormConst)
    private readonly normConstRepository: Repository<NormConst>,
    @InjectRepository(DemandFactor)
    private readonly demandFactorRepository: Repository<DemandFactor>,
    @InjectRepository(Ampacity)
    private readonly ampacityRepository: Repository<Ampacity>,
    @InjectRepository(BreakerCurve)
    private readonly breakerCurveRepository: Repository<BreakerCurve>,
    @InjectRepository(Resistivity)
    private readonly resistivityRepository: Repository<Resistivity>,
    @InjectRepository(GroundingRules)
    private readonly groundingRulesRepository: Repository<GroundingRules>,
  ) {}

  async seed(): Promise<void> {
    try {
      // Verificar si ya existen datos
      const [
        instalacionesCount,
        ambientesCount,
        artefactosCount,
        normConstCount,
        demandFactorCount,
        ampacityCount,
        breakerCurveCount,
        resistivityCount,
        groundingRulesCount,
      ] = await Promise.all([
        this.tipoInstalacionRepository.count(),
        this.tipoAmbienteRepository.count(),
        this.tipoArtefactoRepository.count(),
        this.normConstRepository.count(),
        this.demandFactorRepository.count(),
        this.ampacityRepository.count(),
        this.breakerCurveRepository.count(),
        this.resistivityRepository.count(),
        this.groundingRulesRepository.count(),
      ]);

      if (instalacionesCount === 0) {
        await this.seedTiposInstalaciones();
      }

      if (ambientesCount === 0) {
        await this.seedTiposAmbientes();
      }

      if (artefactosCount === 0) {
        await this.seedTiposArtefactos();
      }

      if (normConstCount === 0) {
        await this.seedNormConst();
      }

      if (demandFactorCount === 0) {
        await this.seedDemandFactor();
      }

      if (ampacityCount === 0) {
        await this.seedAmpacity();
      }

      if (breakerCurveCount === 0) {
        await this.seedBreakerCurve();
      }

      if (resistivityCount === 0) {
        await this.seedResistivity();
      }

      if (groundingRulesCount === 0) {
        await this.seedGroundingRules();
      }
    } catch (error) {
      console.error('Error al realizar el seed:', error);
      throw error;
    }
  }

  private async seedTiposInstalaciones(): Promise<void> {
    const instalaciones = tiposInstalaciones.map((instalacion) => ({
      id: instalacion.id.toString(),
      nombre: instalacion.nombre,
      descripcion: instalacion.descripcion,
      activo: instalacion.activo,
      creadoPor: 'SEED',
      actualizadoPor: 'SEED',
    }));

    await this.tipoInstalacionRepository.save(instalaciones);
    console.log('Tipos de instalaciones sembrados correctamente');
  }

  private async seedTiposAmbientes(): Promise<void> {
    const ambientes = tiposAmbientes.map((ambiente) => ({
      id: ambiente.id.toString(),
      nombre: ambiente.nombre,
      descripcion: ambiente.descripcion,
      activo: ambiente.activo,
      tipoInstalacion: { id: ambiente.tipoInstalacion_Id.toString() },
      creadoPor: 'SEED',
      actualizadoPor: 'SEED',
    }));

    await this.tipoAmbienteRepository.save(ambientes);
    console.log('Tipos de ambientes sembrados correctamente');
  }

  private async seedTiposArtefactos(): Promise<void> {
    const artefactos = tiposArtefactos.map((artefacto) => ({
      id: artefacto.id.toString(),
      nombre: artefacto.Nombre,
      descripcion: artefacto.descripcion || '',
      activo: artefacto.activo,
      potencia: artefacto.Potencia,
      voltaje: 120, // Voltaje estándar en RD
      tipoAmbiente: { id: artefacto.EspacioId.toString() },
      creadoPor: 'SEED',
      actualizadoPor: 'SEED',
    }));

    await this.tipoArtefactoRepository.save(artefactos);
    console.log('Tipos de artefactos sembrados correctamente');
  }

  private async seedNormConst(): Promise<void> {
    const normParams = [
      {
        key: 'lighting_va_per_m2',
        value: '32.3',
        unit: 'VA/m2',
        notes: 'TODO_RIE: valor base; origen NEC 3VA/ft2 aprox.',
        creadoPor: 'SEED',
        actualizadoPor: 'SEED',
      },
      {
        key: 'socket_max_va_per_circuit',
        value: '1800',
        unit: 'VA',
        notes: 'TODO_RIE',
        creadoPor: 'SEED',
        actualizadoPor: 'SEED',
      },
      {
        key: 'circuit_max_utilization',
        value: '0.8',
        unit: 'ratio',
        notes: '80%',
        creadoPor: 'SEED',
        actualizadoPor: 'SEED',
      },
      {
        key: 'vd_branch_limit_pct',
        value: '3',
        unit: '%',
        notes: 'Límite recomendado',
        creadoPor: 'SEED',
        actualizadoPor: 'SEED',
      },
      {
        key: 'vd_total_limit_pct',
        value: '5',
        unit: '%',
        notes: 'Límite recomendado',
        creadoPor: 'SEED',
        actualizadoPor: 'SEED',
      },
      {
        key: 'system_type',
        value: '1',
        unit: 'ph',
        notes: '1=monofásico,3=trifásico',
        creadoPor: 'SEED',
        actualizadoPor: 'SEED',
      },
    ];

    await this.normConstRepository.save(normParams);
    console.log('Parámetros normativos sembrados correctamente');
  }

  private async seedDemandFactor(): Promise<void> {
    const demandFactors = [
      {
        category: 'lighting_general',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 1.0,
        notes: 'TODO_RIE: Factor base para iluminación general',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        category: 'tomas_generales',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 1.0,
        notes: 'TODO_RIE: Factor base para tomacorrientes generales',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        category: 'electrodomesticos',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 0.85,
        notes: 'TODO_RIE: Factor típico para electrodomésticos no simultáneos',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        category: 'climatizacion',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 1.0,
        notes: 'TODO_RIE: Factor base para climatización - revisar según RIE',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        category: 'especiales',
        rangeMin: 0,
        rangeMax: 999999,
        factor: 1.0,
        notes: 'TODO_RIE: Factor base para cargas especiales',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
    ];

    await this.demandFactorRepository.save(demandFactors);
    console.log('Factores de demanda sembrados correctamente');
  }

  private async seedAmpacity(): Promise<void> {
    const ampacities = [
      {
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 12,
        seccionMm2: 3.31,
        amp: 20,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 10,
        seccionMm2: 5.26,
        amp: 30,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 8,
        seccionMm2: 8.37,
        amp: 55,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 6,
        seccionMm2: 13.3,
        amp: 65,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        insulation: 'THHN',
        tempC: 75,
        calibreAwg: 4,
        seccionMm2: 21.15,
        amp: 85,
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
    ];

    await this.ampacityRepository.save(ampacities);
    console.log('Ampacidades sembradas correctamente');
  }

  private async seedBreakerCurve(): Promise<void> {
    const breakerCurves = [
      {
        amp: 15,
        poles: 1,
        curve: 'C',
        useCase: 'iluminacion',
        notes: 'TODO_RIE: Breaker estándar para iluminación',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        amp: 20,
        poles: 1,
        curve: 'C',
        useCase: 'tomas generales',
        notes: 'TODO_RIE: Breaker estándar para tomas',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        amp: 30,
        poles: 2,
        curve: 'C',
        useCase: 'electrodomestico',
        notes: 'TODO_RIE: Breaker para electrodomésticos 240V',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        amp: 40,
        poles: 2,
        curve: 'C',
        useCase: 'climatizacion',
        notes: 'TODO_RIE: Breaker para aires acondicionados',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        amp: 25,
        poles: 1,
        curve: 'C',
        useCase: 'tomas generales',
        notes: 'TODO_RIE: Breaker para cargas mayores',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
    ];

    await this.breakerCurveRepository.save(breakerCurves);
    console.log('Breaker curves sembrados correctamente');
  }

  private async seedResistivity(): Promise<void> {
    const resistividades = [
      // Cobre (Cu)
      {
        material: 'Cu',
        seccionMm2: 2.5,
        ohmKm: 7.41,
        notes: 'Cable de cobre 2.5mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 4,
        ohmKm: 4.61,
        notes: 'Cable de cobre 4mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 6,
        ohmKm: 3.08,
        notes: 'Cable de cobre 6mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 10,
        ohmKm: 1.83,
        notes: 'Cable de cobre 10mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 16,
        ohmKm: 1.15,
        notes: 'Cable de cobre 16mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 25,
        ohmKm: 0.727,
        notes: 'Cable de cobre 25mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 35,
        ohmKm: 0.524,
        notes: 'Cable de cobre 35mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 50,
        ohmKm: 0.387,
        notes: 'Cable de cobre 50mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 70,
        ohmKm: 0.268,
        notes: 'Cable de cobre 70mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 95,
        ohmKm: 0.193,
        notes: 'Cable de cobre 95mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 120,
        ohmKm: 0.153,
        notes: 'Cable de cobre 120mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 150,
        ohmKm: 0.124,
        notes: 'Cable de cobre 150mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 185,
        ohmKm: 0.0991,
        notes: 'Cable de cobre 185mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 240,
        ohmKm: 0.0754,
        notes: 'Cable de cobre 240mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 300,
        ohmKm: 0.0601,
        notes: 'Cable de cobre 300mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 400,
        ohmKm: 0.047,
        notes: 'Cable de cobre 400mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 500,
        ohmKm: 0.0366,
        notes: 'Cable de cobre 500mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Cu',
        seccionMm2: 630,
        ohmKm: 0.0283,
        notes: 'Cable de cobre 630mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      // Aluminio (Al)
      {
        material: 'Al',
        seccionMm2: 6,
        ohmKm: 4.84,
        notes: 'Cable de aluminio 6mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 10,
        ohmKm: 2.9,
        notes: 'Cable de aluminio 10mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 16,
        ohmKm: 1.91,
        notes: 'Cable de aluminio 16mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 25,
        ohmKm: 1.2,
        notes: 'Cable de aluminio 25mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 35,
        ohmKm: 0.868,
        notes: 'Cable de aluminio 35mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 50,
        ohmKm: 0.641,
        notes: 'Cable de aluminio 50mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 70,
        ohmKm: 0.443,
        notes: 'Cable de aluminio 70mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 95,
        ohmKm: 0.32,
        notes: 'Cable de aluminio 95mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 120,
        ohmKm: 0.253,
        notes: 'Cable de aluminio 120mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 150,
        ohmKm: 0.206,
        notes: 'Cable de aluminio 150mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 185,
        ohmKm: 0.164,
        notes: 'Cable de aluminio 185mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 240,
        ohmKm: 0.125,
        notes: 'Cable de aluminio 240mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 300,
        ohmKm: 0.1,
        notes: 'Cable de aluminio 300mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 400,
        ohmKm: 0.0778,
        notes: 'Cable de aluminio 400mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 500,
        ohmKm: 0.0607,
        notes: 'Cable de aluminio 500mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
      {
        material: 'Al',
        seccionMm2: 630,
        ohmKm: 0.0469,
        notes: 'Cable de aluminio 630mm² - Resistividad estándar',
        usrCreate: 'SEED',
        usrUpdate: 'SEED',
        active: true,
      },
    ];

    await this.resistivityRepository.save(resistividades);
    console.log('Resistividades sembradas correctamente');
  }

  private async seedGroundingRules(): Promise<void> {
    const groundingRulesData = [
      // Reglas básicas según NEC 250.66 y prácticas estándar
      {
        mainBreakerAmp: 60,
        egcMm2: 6,
        gecMm2: 10,
        notes: 'TODO_RIE: Breaker hasta 60A - EGC 6mm², GEC 10mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 100,
        egcMm2: 10,
        gecMm2: 16,
        notes: 'TODO_RIE: Breaker hasta 100A - EGC 10mm², GEC 16mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 125,
        egcMm2: 16,
        gecMm2: 25,
        notes: 'TODO_RIE: Breaker hasta 125A - EGC 16mm², GEC 25mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 150,
        egcMm2: 16,
        gecMm2: 25,
        notes: 'TODO_RIE: Breaker hasta 150A - EGC 16mm², GEC 25mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 200,
        egcMm2: 25,
        gecMm2: 35,
        notes: 'TODO_RIE: Breaker hasta 200A - EGC 25mm², GEC 35mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 225,
        egcMm2: 25,
        gecMm2: 35,
        notes: 'TODO_RIE: Breaker hasta 225A - EGC 25mm², GEC 35mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 250,
        egcMm2: 35,
        gecMm2: 50,
        notes: 'TODO_RIE: Breaker hasta 250A - EGC 35mm², GEC 50mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 300,
        egcMm2: 35,
        gecMm2: 50,
        notes: 'TODO_RIE: Breaker hasta 300A - EGC 35mm², GEC 50mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 350,
        egcMm2: 50,
        gecMm2: 70,
        notes: 'TODO_RIE: Breaker hasta 350A - EGC 50mm², GEC 70mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 400,
        egcMm2: 50,
        gecMm2: 70,
        notes: 'TODO_RIE: Breaker hasta 400A - EGC 50mm², GEC 70mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 450,
        egcMm2: 70,
        gecMm2: 95,
        notes: 'TODO_RIE: Breaker hasta 450A - EGC 70mm², GEC 95mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 500,
        egcMm2: 70,
        gecMm2: 95,
        notes: 'TODO_RIE: Breaker hasta 500A - EGC 70mm², GEC 95mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 600,
        egcMm2: 95,
        gecMm2: 120,
        notes: 'TODO_RIE: Breaker hasta 600A - EGC 95mm², GEC 120mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 700,
        egcMm2: 95,
        gecMm2: 120,
        notes: 'TODO_RIE: Breaker hasta 700A - EGC 95mm², GEC 120mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 800,
        egcMm2: 120,
        gecMm2: 150,
        notes: 'TODO_RIE: Breaker hasta 800A - EGC 120mm², GEC 150mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 900,
        egcMm2: 120,
        gecMm2: 150,
        notes: 'TODO_RIE: Breaker hasta 900A - EGC 120mm², GEC 150mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 1000,
        egcMm2: 150,
        gecMm2: 185,
        notes: 'TODO_RIE: Breaker hasta 1000A - EGC 150mm², GEC 185mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 1200,
        egcMm2: 150,
        gecMm2: 185,
        notes: 'TODO_RIE: Breaker hasta 1200A - EGC 150mm², GEC 185mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 1400,
        egcMm2: 185,
        gecMm2: 240,
        notes: 'TODO_RIE: Breaker hasta 1400A - EGC 185mm², GEC 240mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 1600,
        egcMm2: 185,
        gecMm2: 240,
        notes: 'TODO_RIE: Breaker hasta 1600A - EGC 185mm², GEC 240mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 1800,
        egcMm2: 240,
        gecMm2: 300,
        notes: 'TODO_RIE: Breaker hasta 1800A - EGC 240mm², GEC 300mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 2000,
        egcMm2: 240,
        gecMm2: 300,
        notes: 'TODO_RIE: Breaker hasta 2000A - EGC 240mm², GEC 300mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 2500,
        egcMm2: 300,
        gecMm2: 400,
        notes: 'TODO_RIE: Breaker hasta 2500A - EGC 300mm², GEC 400mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 3000,
        egcMm2: 300,
        gecMm2: 400,
        notes: 'TODO_RIE: Breaker hasta 3000A - EGC 300mm², GEC 400mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 3500,
        egcMm2: 400,
        gecMm2: 500,
        notes: 'TODO_RIE: Breaker hasta 3500A - EGC 400mm², GEC 500mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 4000,
        egcMm2: 400,
        gecMm2: 500,
        notes: 'TODO_RIE: Breaker hasta 4000A - EGC 400mm², GEC 500mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 4500,
        egcMm2: 500,
        gecMm2: 630,
        notes: 'TODO_RIE: Breaker hasta 4500A - EGC 500mm², GEC 630mm²',
        usrCreate: 'SEED',
      },
      {
        mainBreakerAmp: 5000,
        egcMm2: 500,
        gecMm2: 630,
        notes: 'TODO_RIE: Breaker hasta 5000A - EGC 500mm², GEC 630mm²',
        usrCreate: 'SEED',
      },
    ];

    const entities = groundingRulesData.map((data) => {
      const entity = new GroundingRules();
      entity.mainBreakerAmp = data.mainBreakerAmp;
      entity.egcMm2 = data.egcMm2;
      entity.gecMm2 = data.gecMm2;
      entity.notes = data.notes;
      entity.usrCreate = data.usrCreate;
      entity.active = true;
      return entity;
    });

    await this.groundingRulesRepository.save(entities);
    console.log(`✅ ${entities.length} reglas de puesta a tierra insertadas`);
  }

  async onModuleInit() {
    try {
      console.log('Iniciando seeds...');

      // Convertir IDs numéricos a strings para tipos_instalaciones
      const tiposInstalacionesFormateados = tiposInstalaciones.map((tipo) => ({
        ...tipo,
        id: tipo.id.toString(),
      }));
      await this.tipoInstalacionRepository.save(tiposInstalacionesFormateados);
      console.log('Seeds de tipos_instalaciones completados.');

      // Convertir IDs numéricos a strings para tipos_ambientes
      const tiposAmbientesFormateados = tiposAmbientes.map((tipo) => ({
        ...tipo,
        id: tipo.id.toString(),
        tipoInstalacion: { id: tipo.tipoInstalacion_Id.toString() },
      }));
      await this.tipoAmbienteRepository.save(tiposAmbientesFormateados);
      console.log('Seeds de tipos_ambientes completados.');

      // Convertir IDs numéricos a strings para tipos_artefactos
      const tiposArtefactosFormateados = tiposArtefactos.map((tipo) => ({
        ...tipo,
        id: tipo.id.toString(),
        nombre: tipo.Nombre,
        potencia: tipo.Potencia,
        voltaje: 120, // Voltaje estándar en RD
        tipoAmbiente: { id: tipo.EspacioId.toString() },
      }));
      await this.tipoArtefactoRepository.save(tiposArtefactosFormateados);
      console.log('Seeds de tipos_artefactos completados.');
    } catch (error) {
      console.error('Error al ejecutar seeds:', error);
    }
  }
}
