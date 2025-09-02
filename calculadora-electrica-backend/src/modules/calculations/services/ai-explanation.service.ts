import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { NormParamService } from './norm-param.service';

export interface ExplicacionCircuito {
  circuitoId: string;
  tipo: string;
  explicacion: string;
  decisiones: Array<{
    aspecto: string;
    decision: string;
    justificacion: string;
    alternativas: string[];
  }>;
  optimizaciones: Array<{
    tipo: 'COSTO' | 'EFICIENCIA' | 'SEGURIDAD' | 'MANTENIMIENTO';
    descripcion: string;
    impacto: 'ALTO' | 'MEDIO' | 'BAJO';
    implementacion: string;
  }>;
  recomendaciones: string[];
  scoreInteligencia: number; // 0-100
}

export interface AnalisisIA {
  sistemaId: string;
  timestamp: Date;
  explicaciones: ExplicacionCircuito[];
  resumen: {
    totalCircuitos: number;
    circuitosOptimizados: number;
    ahorroEstimado: number; // USD
    mejorasSeguridad: number;
    scoreGeneral: number;
  };
  insights: {
    patronesIdentificados: string[];
    oportunidadesMejora: string[];
    riesgosPotenciales: string[];
    tendenciasNormativas: string[];
  };
  metadata: {
    modeloIA: string;
    tokensUtilizados: number;
    duracionAnalisis: number;
    version: string;
  };
}

export interface PromptTemplate {
  system: string;
  user: string;
  examples: Array<{
    input: any;
    output: string;
  }>;
}

@Injectable()
export class AIExplanationService {
  private readonly logger = new Logger(AIExplanationService.name);
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly normParamService: NormParamService,
  ) {
    this.initializeOpenAI();
  }

  /**
   * Inicializa la API de OpenAI
   */
  private initializeOpenAI() {
    try {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        this.logger.warn('OPENAI_API_KEY no configurada, funcionalidad de IA limitada');
        return;
      }

      this.openai = new OpenAI({
        apiKey,
      });
      this.logger.log('OpenAI API inicializada correctamente');
    } catch (error) {
      this.logger.error('Error inicializando OpenAI API', error);
    }
  }

  /**
   * Genera explicaciones inteligentes para un circuito
   */
  async generarExplicacionCircuito(
    datosCircuito: any,
    contexto: any,
    warnings: string[] = [],
  ): Promise<ExplicacionCircuito> {
    try {
      if (!this.openai) {
        return this.generarExplicacionLocal(datosCircuito, contexto);
      }

      const prompt = this.construirPromptCircuito(datosCircuito, contexto);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const explicacionIA = response.choices[0]?.message?.content || '';
      return this.parsearExplicacionIA(explicacionIA, datosCircuito);
    } catch (error) {
      this.logger.warn('Error en IA, usando explicación local', error);
      return this.generarExplicacionLocal(datosCircuito, contexto);
    }
  }

  /**
   * Genera explicaciones para múltiples circuitos
   */
  async generarExplicacionesMultiples(
    circuitos: any[],
    contexto: any,
  ): Promise<ExplicacionCircuito[]> {
    const explicaciones: ExplicacionCircuito[] = [];
    const warnings: string[] = [];

    for (const circuito of circuitos) {
      try {
        const explicacion = await this.generarExplicacionCircuito(
          circuito,
          contexto,
          warnings,
        );
        explicaciones.push(explicacion);
      } catch (error) {
        this.logger.warn(
          `Error generando explicación para circuito ${circuito.id}`,
          error,
        );
        warnings.push(`Circuito ${circuito.id}: ${error.message}`);
      }
    }

    return explicaciones;
  }

  /**
   * Analiza un sistema completo con IA
   */
  async analizarSistemaCompleto(
    sistema: any,
    resultadosValidacion: any,
    warnings: string[] = [],
  ): Promise<AnalisisIA> {
    const startTime = Date.now();

    try {
      // Generar explicaciones para cada circuito
      const explicaciones = await this.generarExplicacionesMultiples(
        resultadosValidacion.validaciones.dimensionamientoConductores || [],
        { sistema, resultadosValidacion },
      );

      // Analizar patrones y generar insights
      const insights = await this.generarInsights(sistema, explicaciones, warnings);

      // Calcular resumen
      const resumen = this.calcularResumenAnalisis(explicaciones, sistema);

      const duracionAnalisis = Date.now() - startTime;

      return {
        sistemaId: sistema.id,
        timestamp: new Date(),
        explicaciones,
        resumen,
        insights,
        metadata: {
          modeloIA: 'gpt-4o-mini',
          tokensUtilizados: explicaciones.length * 150, // Estimación
          duracionAnalisis,
          version: '1.0.0',
        },
      };
    } catch (error) {
      this.logger.error('Error en análisis completo del sistema', error);
      throw new Error(`Error en análisis IA del sistema: ${error.message}`);
    }
  }

  /**
   * Genera explicación local cuando OpenAI no está disponible
   */
  private generarExplicacionLocal(
    datosCircuito: any,
    contexto: any,
  ): ExplicacionCircuito {
    const explicacion = this.analizarDecisionesLocal(datosCircuito);
    const optimizaciones = this.generarOptimizacionesLocal(datosCircuito);
    const recomendaciones = this.generarRecomendacionesLocal(datosCircuito);

    return {
      circuitoId: datosCircuito.circuitoId || 'UNKNOWN',
      tipo: datosCircuito.tipo || 'GENERAL',
      explicacion: 'Análisis local del circuito eléctrico',
      decisiones: this.analizarDecisionesLocal(datosCircuito),
      optimizaciones,
      recomendaciones,
      scoreInteligencia: this.calcularScoreLocal(datosCircuito),
    };
  }

  /**
   * Analiza las decisiones tomadas en el circuito
   */
  private analizarDecisionesLocal(datosCircuito: any): Array<{
    aspecto: string;
    decision: string;
    justificacion: string;
    alternativas: string[];
  }> {
    const decisiones: Array<{
      aspecto: string;
      decision: string;
      justificacion: string;
      alternativas: string[];
    }> = [];

    // Análisis de conductor
    if (datosCircuito.resultado?.seccion) {
      decisiones.push({
        aspecto: 'Dimensionamiento de Conductor',
        decision: `Seleccionado conductor de ${datosCircuito.resultado.seccion}mm²`,
        justificacion: `Capacidad de corriente: ${datosCircuito.resultado.corrienteDiseño}A, Ampacidad corregida: ${datosCircuito.resultado.ampacidadCorregida}A`,
        alternativas: this.generarAlternativasConductor(datosCircuito.resultado),
      });
    }

    // Análisis de protección
    if (datosCircuito.resultado?.amperaje) {
      decisiones.push({
        aspecto: 'Selección de Protección',
        decision: `Protección ${datosCircuito.resultado.tipo} ${datosCircuito.resultado.amperaje}A curva ${datosCircuito.resultado.curva}`,
        justificacion: `Corriente de diseño: ${datosCircuito.resultado.corrienteDiseño}A, Factor de seguridad: ${datosCircuito.resultado.factorSeguridad || 'N/A'}`,
        alternativas: this.generarAlternativasProteccion(datosCircuito.resultado),
      });
    }

    // Análisis de caída de tensión
    if (datosCircuito.resultado?.caidaPorcentual) {
      decisiones.push({
        aspecto: 'Análisis de Caída de Tensión',
        decision: `Caída de tensión: ${datosCircuito.resultado.caidaPorcentual.toFixed(2)}%`,
        justificacion: `Límite normativo: ${datosCircuito.resultado.limiteAplicable || 'N/A'}%, Estado: ${datosCircuito.resultado.cumpleNorma ? 'CUMPLE' : 'NO CUMPLE'}`,
        alternativas: this.generarAlternativasCaidaTension(datosCircuito.resultado),
      });
    }

    return decisiones;
  }

  /**
   * Genera alternativas para conductores
   */
  private generarAlternativasConductor(resultado: any): string[] {
    const alternativas: string[] = [];
    const seccion = resultado.seccion;

    if (seccion <= 6) {
      alternativas.push('Considerar conductor de mayor sección para mejor eficiencia');
    } else if (seccion >= 50) {
      alternativas.push('Evaluar si la sección puede reducirse para optimizar costos');
    }

    if (resultado.material === 'ALUMINIO') {
      alternativas.push('Evaluar cambio a cobre para mejor conductividad');
    }

    if (resultado.factoresCorreccion?.temperatura > 1.2) {
      alternativas.push('Considerar mejor ventilación para reducir factor de temperatura');
    }

    return alternativas;
  }

  /**
   * Genera alternativas para protecciones
   */
  private generarAlternativasProteccion(resultado: any): string[] {
    const alternativas: string[] = [];

    if (resultado.factorSeguridad > 3) {
      alternativas.push('Evaluar protección de menor amperaje para optimizar costos');
    }

    if (resultado.curva === 'B' && resultado.corrienteDiseño > 20) {
      alternativas.push('Considerar curva C para mejor protección en cargas inductivas');
    }

    if (!resultado.caracteristicas?.includes('GFCI') && resultado.ambiente?.includes('BANO')) {
      alternativas.push('Agregar protección GFCI para cumplir normas de seguridad');
    }

    return alternativas;
  }

  /**
   * Genera alternativas para caída de tensión
   */
  private generarAlternativasCaidaTension(resultado: any): string[] {
    const alternativas: string[] = [];

    if (resultado.caidaPorcentual > resultado.limiteAplicable) {
      alternativas.push('Aumentar sección del conductor');
      alternativas.push('Reducir longitud del circuito');
      alternativas.push('Cambiar a conductor de cobre');
    }

    if (resultado.caidaPorcentual < resultado.limiteAplicable * 0.5) {
      alternativas.push('Evaluar reducción de sección para optimizar costos');
    }

    return alternativas;
  }

  /**
   * Genera optimizaciones para el circuito
   */
  private generarOptimizacionesLocal(datosCircuito: any): Array<{
    tipo: 'COSTO' | 'EFICIENCIA' | 'SEGURIDAD' | 'MANTENIMIENTO';
    descripcion: string;
    impacto: 'ALTO' | 'MEDIO' | 'BAJO';
    implementacion: string;
  }> {
    const optimizaciones: Array<{
      tipo: 'COSTO' | 'EFICIENCIA' | 'SEGURIDAD' | 'MANTENIMIENTO';
      descripcion: string;
      impacto: 'ALTO' | 'MEDIO' | 'BAJO';
      implementacion: string;
    }> = [];

    // Optimizaciones de costo
    if (datosCircuito.resultado?.seccion > 25) {
      optimizaciones.push({
        tipo: 'COSTO',
        descripcion: 'Evaluar reducción de sección del conductor',
        impacto: 'MEDIO',
        implementacion: 'Análisis de caída de tensión con secciones menores',
      });
    }

    // Optimizaciones de eficiencia
    if (datosCircuito.resultado?.material === 'ALUMINIO') {
      optimizaciones.push({
        tipo: 'EFICIENCIA',
        descripcion: 'Cambiar a conductor de cobre',
        impacto: 'ALTO',
        implementacion: 'Reemplazo completo del conductor',
      });
    }

    // Optimizaciones de seguridad
    if (!datosCircuito.resultado?.caracteristicas?.includes('GFCI')) {
      optimizaciones.push({
        tipo: 'SEGURIDAD',
        descripcion: 'Agregar protección GFCI',
        impacto: 'ALTO',
        implementacion: 'Cambio de protección existente',
      });
    }

    // Optimizaciones de mantenimiento
    optimizaciones.push({
      tipo: 'MANTENIMIENTO',
      descripcion: 'Implementar monitoreo de temperatura',
      impacto: 'BAJO',
      implementacion: 'Instalación de sensores térmicos',
    });

    return optimizaciones;
  }

  /**
   * Genera recomendaciones para el circuito
   */
  private generarRecomendacionesLocal(datosCircuito: any): string[] {
    const recomendaciones: string[] = [];

    if (datosCircuito.resultado?.cumpleNorma === false) {
      recomendaciones.push('Revisar y corregir aspectos que no cumplen la norma');
    }

    if (datosCircuito.resultado?.margenSeguridad < 1.5) {
      recomendaciones.push('Considerar aumentar el margen de seguridad');
    }

    if (datosCircuito.resultado?.factoresCorreccion?.total > 1.5) {
      recomendaciones.push('Evaluar condiciones ambientales para reducir factores de corrección');
    }

    recomendaciones.push('Realizar pruebas de funcionamiento antes de la puesta en servicio');
    recomendaciones.push('Documentar todas las decisiones de diseño para futuras referencias');

    return recomendaciones;
  }

  /**
   * Calcula el score de inteligencia local
   */
  private calcularScoreLocal(datosCircuito: any): number {
    let score = 50; // Score base

    // Bonificaciones por buenas decisiones
    if (datosCircuito.resultado?.cumpleNorma) score += 20;
    if (datosCircuito.resultado?.margenSeguridad >= 1.5) score += 15;
    if (datosCircuito.resultado?.material === 'COBRE') score += 10;
    if (datosCircuito.resultado?.caracteristicas?.includes('GFCI')) score += 5;

    // Penalizaciones por problemas
    if (datosCircuito.resultado?.caidaPorcentual > 5) score -= 15;
    if (datosCircuito.resultado?.factoresCorreccion?.total > 2) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Construye el prompt para OpenAI
   */
  private construirPromptCircuito(
    datosCircuito: any,
    contexto: any,
  ): PromptTemplate {
    return {
      system: `Eres un ingeniero eléctrico experto que analiza sistemas eléctricos.
      Tu tarea es explicar las decisiones tomadas en el diseño de circuitos eléctricos,
      identificar oportunidades de optimización y generar recomendaciones técnicas.

      Responde en español, sé técnico pero comprensible, y proporciona alternativas
      prácticas y económicamente viables.`,

      user: `Analiza el siguiente circuito eléctrico y proporciona:

      **Datos del Circuito:**
      ${JSON.stringify(datosCircuito, null, 2)}

      **Contexto del Sistema:**
      ${JSON.stringify(contexto, null, 2)}

      **Formato de Respuesta:**
      {
        "explicacion": "Explicación general del circuito",
        "decisiones": [
          {
            "aspecto": "Aspecto analizado",
            "decision": "Decisión tomada",
            "justificacion": "Justificación técnica",
            "alternativas": ["Alternativa 1", "Alternativa 2"]
          }
        ],
        "optimizaciones": [
          {
            "tipo": "COSTO|EFICIENCIA|SEGURIDAD|MANTENIMIENTO",
            "descripcion": "Descripción de la optimización",
            "impacto": "ALTO|MEDIO|BAJO",
            "implementacion": "Cómo implementar"
          }
        ],
        "recomendaciones": ["Recomendación 1", "Recomendación 2"],
        "scoreInteligencia": 85
      }`,

      examples: [
        {
          input: {
            tipo: 'TOM',
            seccion: 6,
            material: 'COBRE',
            amperaje: 20,
          },
          output: `{
            "explicacion": "Circuito de tomacorrientes con conductor de cobre de 6mm² y protección de 20A",
            "decisiones": [
              {
                "aspecto": "Dimensionamiento",
                "decision": "Conductor de 6mm² seleccionado",
                "justificacion": "Adecuado para corriente de diseño y factor de seguridad",
                "alternativas": ["Evaluar 4mm² si la longitud es corta", "Considerar 10mm² para futuras expansiones"]
              }
            ],
            "optimizaciones": [
              {
                "tipo": "COSTO",
                "descripcion": "Evaluar reducción a 4mm²",
                "impacto": "MEDIO",
                "implementacion": "Verificar caída de tensión con sección menor"
              }
            ],
            "recomendaciones": ["Verificar cumplimiento de caída de tensión", "Documentar decisiones de diseño"],
            "scoreInteligencia": 85
          }`,
        },
      ],
    };
  }

  /**
   * Parsea la respuesta de la IA
   */
  private parsearExplicacionIA(
    respuestaIA: string,
    datosCircuito: any,
  ): ExplicacionCircuito {
    try {
      const parsed = JSON.parse(respuestaIA);
      return {
        circuitoId: datosCircuito.circuitoId || 'UNKNOWN',
        tipo: datosCircuito.tipo || 'GENERAL',
        explicacion: parsed.explicacion || 'Análisis no disponible',
        decisiones: parsed.decisiones || [],
        optimizaciones: parsed.optimizaciones || [],
        recomendaciones: parsed.recomendaciones || [],
        scoreInteligencia: parsed.scoreInteligencia || 50,
      };
    } catch (error) {
      this.logger.warn('Error parseando respuesta de IA, usando valores por defecto', error);
      return this.generarExplicacionLocal(datosCircuito, {});
    }
  }

  /**
   * Genera insights del sistema
   */
  private async generarInsights(
    sistema: any,
    explicaciones: ExplicacionCircuito[],
    warnings: string[],
  ): Promise<AnalisisIA['insights']> {
    try {
      if (!this.openai) {
        return this.generarInsightsLocal(sistema, explicaciones);
      }

      const prompt = this.construirPromptInsights(sistema, explicaciones);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        max_tokens: 800,
        temperature: 0.6,
      });

      const insightsIA = response.choices[0]?.message?.content || '';
      return this.parsearInsightsIA(insightsIA);
    } catch (error) {
      this.logger.warn('Error generando insights con IA, usando análisis local', error);
      return this.generarInsightsLocal(sistema, explicaciones);
    }
  }

  /**
   * Genera insights locales
   */
  private generarInsightsLocal(
    sistema: any,
    explicaciones: ExplicacionCircuito[],
  ): AnalisisIA['insights'] {
    const patrones: string[] = [];
    const oportunidades: string[] = [];
    const riesgos: string[] = [];
    const tendencias: string[] = [];

    // Análisis de patrones
    const materiales = explicaciones.map(e => e.decisiones.find(d => d.aspecto.includes('Conductor'))?.decision);
    if (materiales.every(m => m?.includes('COBRE'))) {
      patrones.push('Uso consistente de conductores de cobre en todo el sistema');
    }

    // Oportunidades de mejora
    const scoresBajos = explicaciones.filter(e => e.scoreInteligencia < 70);
    if (scoresBajos.length > 0) {
      oportunidades.push(`${scoresBajos.length} circuitos requieren optimización prioritaria`);
    }

    // Riesgos potenciales
    const sinGFCI = explicaciones.filter(e =>
      !e.decisiones.some(d => d.alternativas.some(a => a.includes('GFCI')))
    );
    if (sinGFCI.length > 0) {
      riesgos.push('Falta de protección GFCI en áreas húmedas');
    }

    // Tendencia normativa
    tendencias.push('Tendencia hacia mayor uso de protecciones inteligentes');
    tendencias.push('Enfoque en eficiencia energética y sostenibilidad');

    return {
      patronesIdentificados: patrones,
      oportunidadesMejora: oportunidades,
      riesgosPotenciales: riesgos,
      tendenciasNormativas: tendencias,
    };
  }

  /**
   * Construye prompt para insights
   */
  private construirPromptInsights(
    sistema: any,
    explicaciones: ExplicacionCircuito[],
  ): PromptTemplate {
    return {
      system: `Analiza el sistema eléctrico completo y genera insights sobre patrones,
      oportunidades de mejora, riesgos potenciales y tendencias normativas.
      Sé específico y proporciona recomendaciones accionables.`,

      user: `Analiza el siguiente sistema eléctrico:

      **Sistema:**
      ${JSON.stringify(sistema, null, 2)}

      **Explicaciones de Circuitos:**
      ${JSON.stringify(explicaciones, null, 2)}

      **Formato de Respuesta:**
      {
        "patronesIdentificados": ["Patrón 1", "Patrón 2"],
        "oportunidadesMejora": ["Oportunidad 1", "Oportunidad 2"],
        "riesgosPotenciales": ["Riesgo 1", "Riesgo 2"],
        "tendenciasNormativas": ["Tendencia 1", "Tendencia 2"]
      }`,

      examples: [],
    };
  }

  /**
   * Parsea insights de la IA
   */
  private parsearInsightsIA(respuestaIA: string): AnalisisIA['insights'] {
    try {
      const parsed = JSON.parse(respuestaIA);
      return {
        patronesIdentificados: parsed.patronesIdentificados || [],
        oportunidadesMejora: parsed.oportunidadesMejora || [],
        riesgosPotenciales: parsed.riesgosPotenciales || [],
        tendenciasNormativas: parsed.tendenciasNormativas || [],
      };
    } catch (error) {
      this.logger.warn('Error parseando insights de IA, usando valores por defecto', error);
      return {
        patronesIdentificados: [],
        oportunidadesMejora: [],
        riesgosPotenciales: [],
        tendenciasNormativas: [],
      };
    }
  }

  /**
   * Calcula resumen del análisis
   */
  private calcularResumenAnalisis(
    explicaciones: ExplicacionCircuito[],
    sistema: any,
  ): AnalisisIA['resumen'] {
    const totalCircuitos = explicaciones.length;
    const circuitosOptimizados = explicaciones.filter(e => e.scoreInteligencia >= 80).length;
    const ahorroEstimado = this.calcularAhorroEstimado(explicaciones);
    const mejorasSeguridad = explicaciones.filter(e =>
      e.optimizaciones.some(o => o.tipo === 'SEGURIDAD')
    ).length;
    const scoreGeneral = explicaciones.reduce((sum, e) => sum + e.scoreInteligencia, 0) / totalCircuitos;

    return {
      totalCircuitos,
      circuitosOptimizados,
      ahorroEstimado,
      mejorasSeguridad,
      scoreGeneral: Math.round(scoreGeneral * 100) / 100,
    };
  }

  /**
   * Calcula ahorro estimado
   */
  private calcularAhorroEstimado(explicaciones: ExplicacionCircuito[]): number {
    let ahorroTotal = 0;

    for (const explicacion of explicaciones) {
      for (const optimizacion of explicacion.optimizaciones) {
        if (optimizacion.tipo === 'COSTO') {
          switch (optimizacion.impacto) {
            case 'ALTO':
              ahorroTotal += 150;
              break;
            case 'MEDIO':
              ahorroTotal += 75;
              break;
            case 'BAJO':
              ahorroTotal += 25;
              break;
          }
        }
      }
    }

    return ahorroTotal;
  }
}
