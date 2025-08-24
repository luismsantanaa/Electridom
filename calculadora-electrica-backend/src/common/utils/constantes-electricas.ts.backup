/**
 * Constantes eléctricas para República Dominicana
 * Sistema bifásico 110V/220V a 60Hz
 * Cumple normativas R.I.E., NEC 2020 y CNE
 */
export const CONSTANTES_ELECTRICAS = {
  // Voltajes estándar en República Dominicana
  VOLTAJE_MONOFASICO: 110,
  VOLTAJE_BIFASICO: 220,
  VOLTAJE_TRIFASICO: 208,
  VOLTAJE_TRIFASICO_3: 480,
  FRECUENCIA: 60, // Hz

  // Factores de simultaneidad según R.I.E.
  FACTOR_SIMULTANEIDAD_TUG: 0.7, // Tomacorrientes de Uso General
  FACTOR_SIMULTANEIDAD_TUE: 1.0, // Tomacorrientes de Uso Especial
  FACTOR_SIMULTANEIDAD_ILUMINACION: 0.66, // Iluminación
  FACTOR_SIMULTANEIDAD_AIRES: 1.0, // Aires acondicionados

  // Potencias estándar por circuito (Watts)
  POTENCIA_TUG: 2000, // Tomacorrientes generales
  POTENCIA_TUE: 3000, // Tomacorrientes especiales (cocina)
  POTENCIA_ILUMINACION_POR_BOCA: 150, // Watts por boca de iluminación

  // Cargas mínimas por área según R.I.E. (W/m²)
  CARGA_MINIMA_RESIDENCIAL: 32, // W/m²
  CARGA_MINIMA_COMERCIAL: 50, // W/m²
  CARGA_MINIMA_INDUSTRIAL: 40, // W/m²

  // Cargas específicas por tipo de ambiente
  CARGAS_POR_AMBIENTE: {
    DORMITORIO: 10, // W/m²
    SALA_ESTAR: 15, // W/m²
    COMEDOR: 15, // W/m²
    COCINA: 50, // W/m²
    BANO: 20, // W/m²
    PASILLO: 8, // W/m²
    BALCON: 5, // W/m²
    GARAGE: 5, // W/m²
    LAVANDERIA: 20, // W/m²
    ESTUDIO: 15, // W/m²
    DEPOSITO: 5, // W/m²
    OFICINA_GENERAL: 35, // W/m²
    SALA_REUNIONES: 30, // W/m²
    TIENDA_GENERAL: 40, // W/m²
  },

  // Tomacorrientes por área
  TOMACORRIENTES_POR_AREA: {
    DORMITORIO: 1, // cada 6m²
    SALA_ESTAR: 1, // cada 6m²
    COMEDOR: 1, // cada 6m²
    COCINA: 2, // cada 3m²
    BANO: 1, // mínimo 1
    PASILLO: 1, // cada 10m²
    BALCON: 1, // mínimo 1
    GARAGE: 1, // cada 10m²
    LAVANDERIA: 1, // cada 6m²
    ESTUDIO: 1, // cada 6m²
    DEPOSITO: 1, // cada 10m²
    OFICINA_GENERAL: 1, // cada 6m²
    SALA_REUNIONES: 1, // cada 6m²
    TIENDA_GENERAL: 1, // cada 6m²
  },

  // Caídas de tensión máximas permitidas
  CAIDA_TENSION_MAXIMA: 3.0, // 3% según normativas
  CAIDA_TENSION_RECOMENDADA: 2.0, // 2% recomendado

  // Calibres AWG y equivalencias en mm²
  CALIBRES_AWG: {
    14: { seccionMm2: 2.08, corrienteMaxima: 15, uso: 'Iluminación y TUG' },
    12: { seccionMm2: 3.31, corrienteMaxima: 20, uso: 'TUG y equipos menores' },
    10: {
      seccionMm2: 5.26,
      corrienteMaxima: 30,
      uso: 'TUE y equipos especiales',
    },
    8: {
      seccionMm2: 8.37,
      corrienteMaxima: 40,
      uso: 'Aires y equipos grandes',
    },
    6: { seccionMm2: 13.3, corrienteMaxima: 55, uso: 'Alimentadores' },
    4: {
      seccionMm2: 21.15,
      corrienteMaxima: 70,
      uso: 'Alimentadores principales',
    },
    2: { seccionMm2: 33.62, corrienteMaxima: 95, uso: 'Acometidas' },
  },

  // Breakers estándar disponibles (Amperios)
  BREAKERS_ESTANDAR: [
    15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 200, 225, 250, 300,
    400, 500, 600, 800, 1000,
  ],

  // Tipos de protección requeridos por circuito
  PROTECCIONES_REQUERIDAS: {
    TUG: 'AFCI', // AFCI para tomacorrientes en dormitorios y salas
    TUE: 'GFCI', // GFCI para cocinas, baños, exteriores
    IUG: 'TERMOMAGNETICO', // Breaker estándar para iluminación
    IUE: 'TERMOMAGNETICO',
    CA: 'BIPOLAR', // Bipolar para aires de 220V
    CE: 'BIPOLAR', // Según voltaje del equipo
  },

  // Conductividad del cobre (Ω·mm²/m)
  CONDUCTIVIDAD_COBRE: 0.0175,

  // Factor de corrección por temperatura
  TEMPERATURA_AMBIENTE_DISENO: 30, // °C
  FACTOR_TEMPERATURA_30C: 1.0,
  FACTOR_TEMPERATURA_40C: 0.88,

  // Factores de agrupamiento
  FACTOR_AGRUPAMIENTO_3_CONDUCTORES: 0.8,
  FACTOR_AGRUPAMIENTO_4_6_CONDUCTORES: 0.7,

  // Incrementos para cálculo de cable
  FACTOR_DESPERDICIOS_CABLE: 0.05, // 5% desperdicios
  INCREMENTO_BAJANTES: 0.5, // metros por interruptor
  INCREMENTO_SUBIDAS: 0.3, // metros por tomacorriente

  // Costos estimados (USD) - Solo para referencia
  COSTOS_REFERENCIALES: {
    BREAKER_15A: 8,
    BREAKER_20A: 10,
    BREAKER_30A: 15,
    BREAKER_40A: 20,
    BREAKER_50A: 25,
    AFCI_BREAKER: 45,
    GFCI_BREAKER: 35,
    CABLE_12AWG_METRO: 1.2,
    CABLE_14AWG_METRO: 0.8,
    CABLE_10AWG_METRO: 2.0,
    TABLERO_12_CIRCUITOS: 80,
    TABLERO_24_CIRCUITOS: 120,
  },

  // Códigos de circuitos estándar
  CODIGOS_CIRCUITOS: {
    TUG: 'CTG', // Circuito Tomacorriente General
    TUE: 'CTE', // Circuito Tomacorriente Especial
    IUG: 'CIL', // Circuito Iluminación
    IUE: 'CIE', // Circuito Iluminación Especial
    CA: 'CAA', // Circuito Aire Acondicionado
    CE: 'CEE', // Circuito Equipo Especial
  },
};

type TipoAmbiente = keyof typeof CONSTANTES_ELECTRICAS.CARGAS_POR_AMBIENTE;

/**
 * Funciones de cálculo basadas en las constantes
 */
export class CalculosElectricos {
  /**
   * Calcula la corriente nominal dado potencia y voltaje
   */
  static calcularCorrienteNominal(
    potenciaWatts: number,
    voltaje: number,
    factorPotencia: number = 1,
  ): number {
    if (voltaje === 0) return 0;
    return potenciaWatts / voltaje / factorPotencia;
  }

  /**
   * Calcula la caída de tensión en un circuito
   */
  static calcularCaidaTension(
    corriente: number,
    distancia: number,
    seccionMm2: number,
    voltaje: number,
    numeroHilos: number = 2,
  ): number {
    const resistencia =
      (CONSTANTES_ELECTRICAS.CONDUCTIVIDAD_COBRE * distancia * numeroHilos) /
      seccionMm2;
    const caidaVoltios = corriente * resistencia;
    return (caidaVoltios / voltaje) * 100; // Porcentaje
  }

  /**
   * Determina el calibre AWG mínimo para una corriente dada
   */
  static determinarCalibreMinimo(corriente: number): number {
    const calibres = CONSTANTES_ELECTRICAS.CALIBRES_AWG;

    for (const [awg, datos] of Object.entries(calibres)) {
      if (datos.corrienteMaxima >= corriente * 1.25) {
        // Factor de seguridad 125%
        return parseInt(awg);
      }
    }

    return 2; // AWG más grande disponible
  }

  /**
   * Selecciona el breaker estándar inmediatamente superior
   */
  static seleccionarBreaker(corriente: number): number {
    const breakersDisponibles = CONSTANTES_ELECTRICAS.BREAKERS_ESTANDAR;

    for (const breaker of breakersDisponibles) {
      if (breaker >= corriente) {
        return breaker;
      }
    }

    return breakersDisponibles[breakersDisponibles.length - 1];
  }

  /**
   * Calcula la carga de iluminación mínima para un ambiente
   */
  static calcularCargaIluminacion(
    tipoAmbiente: TipoAmbiente,
    area: number,
  ): number {
    const cargaPorM2 =
      CONSTANTES_ELECTRICAS.CARGAS_POR_AMBIENTE[tipoAmbiente] ?? 10;
    return area * cargaPorM2;
  }

  /**
   * Estima la cantidad de tomacorrientes necesarios
   */
  static estimarTomacorrientes(
    tipoAmbiente: TipoAmbiente,
    area: number,
  ): number {
    const factor =
      CONSTANTES_ELECTRICAS.TOMACORRIENTES_POR_AREA[tipoAmbiente] ?? 1;
    return Math.max(1, Math.ceil(area / 6) * factor);
  }
}
