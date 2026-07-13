// System config
export interface SystemConfig {
  voltage?: number;
  phases?: number;
  frequency?: number;
}

// CE-01: Rooms
export interface Surface {
  name: string;
  area_m2: number;
}

export interface Consumption {
  name: string;
  environment: string;
  power_w: number;
  fp?: number;
  type?: 'iluminacion' | 'toma_general' | 'electrodomstico' | 'climatizacion' | 'especial';
}

export interface RoomsRequest {
  system?: SystemConfig;
  surfaces: Surface[];
  consumptions: Consumption[];
}

export interface EnvironmentResult {
  name: string;
  area_m2: number;
  carga_va: number;
  fp: number;
  observaciones?: string;
}

export interface RoomsTotals {
  carga_total_va: number;
  carga_diversificada_va: number;
  corriente_total_a: number;
  voltage_v: number;
  phases: number;
}

export interface RoomsResponse {
  environments: EnvironmentResult[];
  totales: RoomsTotals;
}

// CE-02: Demand
export interface CategoryLoad {
  category: string;
  carga_va: number;
  description?: string;
}

export interface DemandTotals {
  carga_total_va: number;
  voltage_v: number;
  phases: number;
}

export interface DemandRequest {
  cargas_por_categoria: CategoryLoad[];
  totales: DemandTotals;
  observaciones?: string[];
}

export interface DiversifiedLoad {
  category: string;
  carga_original_va: number;
  demand_factor: number;
  carga_diversificada_va: number;
  rango_aplicado?: string;
  observaciones?: string;
}

export interface DiversifiedTotals {
  carga_total_original_va: number;
  carga_total_diversificada_va: number;
  factor_diversificacion_efectivo: number;
  corriente_total_diversificada_a: number;
  ahorro_carga_va: number;
  porcentaje_ahorro: number;
  voltage_v: number;
  phases: number;
}

export interface DemandResponse {
  cargas_diversificadas: DiversifiedLoad[];
  totales_diversificados: DiversifiedTotals;
  observaciones_generales?: string[];
}

// CE-03: Circuits
export interface DiversifiedLoadInput {
  category: string;
  carga_diversificada_va: number;
  demand_factor?: number;
  description?: string;
  environment?: string;
}

export interface ElectricSystem {
  voltage_v: number;
  phases: number;
  system_type: number;
  frequency?: number;
}

export interface CircuitsRequest {
  cargas_diversificadas: DiversifiedLoadInput[];
  system: ElectricSystem;
  observaciones?: string[];
  configuraciones?: {
    max_utilizacion_circuito?: number;
    separar_por_ambiente?: boolean;
    preferir_monofasico?: boolean;
  };
}

export interface CircuitResult {
  id_circuito: string;
  name: string;
  corriente_total_a: number;
  carga_total_va: number;
  length_m?: number;
}

export interface CircuitsResponse {
  circuitos: CircuitResult[];
  totales: {
    total_circuitos: number;
    carga_total_va: number;
    corriente_total_a: number;
  };
}

// CE-04: Feeder
export interface FeederSystem {
  voltage_v: number;
  phases: number;
  corriente_total_a: number;
  carga_total_va: number;
}

export interface FeederParams {
  longitud_alimentador_m: number;
  material_conductor?: string;
  max_caida_ramal_pct?: number;
  max_caida_total_pct?: number;
}

export interface FeederRequest {
  circuitos_ramales: CircuitResult[];
  system: FeederSystem;
  parameters: FeederParams;
  observaciones?: string[];
}

export interface FeederResponse {
  alimentador: {
    calibre_awg: string;
    section_mm2: number;
    ampacidad_a: number;
    caida_tension_pct: number;
    material: string;
  };
  observaciones?: string[];
}

// CE-05: Grounding
export interface GroundingFeeder {
  current_a: number;
  section_mm2: number;
  material: string;
  length_m: number;
}

export interface GroundingParams {
  main_breaker_amp: number;
  tipo_instalacion?: string;
  tipo_sistema_tierra?: string;
  resistividad_suelo_ohm_m?: number;
}

export interface GroundingRequest {
  system: FeederSystem;
  feeder: GroundingFeeder;
  parameters: GroundingParams;
  observaciones?: string[];
}

export interface GroundingResponse {
  electrodo: {
    tipo: string;
    cantidad: number;
    profundidad_m: number;
    resistencia_ohm: number;
  };
  conductor: {
    section_mm2: number;
    calibre_awg: string;
    material: string;
  };
  observaciones?: string[];
}
