import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CircuitoResultado, ProyectoResultado } from './export.service';

export interface ResultadoModelado {
  proyecto: {
    id: number;
    nombre: string;
    tipo_instalacion: string;
    tension_sistema: number;
    fases: number;
    factor_potencia: number;
  };
  circuitos: Array<{
    id: number;
    ambiente_id: number;
    ambiente_nombre: string;
    tipo: string;
    potencia_va: number;
    corriente_a: number;
    proteccion: {
      id: number;
      tipo: string;
      capacidad_a: number;
      curva: string;
    };
    conductor: {
      id: number;
      calibre_awg: string;
      material: string;
      capacidad_a: number;
      tipo_aislamiento: string;
    };
  }>;
  resumen: {
    total_circuitos: number;
    potencia_total_va: number;
    corriente_total_a: number;
    ambientes_count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ResultadosService {

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los resultados de modelado de un proyecto
   */
  getResultados(proyectoId: number): Observable<ResultadoModelado> {
    return this.http.get<ResultadoModelado>(`${environment.apiUrl}/modelado/proyectos/${proyectoId}/resultados`);
  }

  /**
   * Convierte los datos de la API al formato requerido por el ExportService
   */
  convertToProyectoResultado(resultado: ResultadoModelado): ProyectoResultado {
    const circuitos: CircuitoResultado[] = resultado.circuitos.map(circuito => ({
      id: circuito.id,
      ambienteId: circuito.ambiente_id,
      ambienteNombre: circuito.ambiente_nombre,
      tipo: circuito.tipo,
      potenciaVA: circuito.potencia_va,
      corrienteA: circuito.corriente_a,
      proteccion: {
        tipo: circuito.proteccion.tipo,
        capacidadA: circuito.proteccion.capacidad_a,
        curva: circuito.proteccion.curva
      },
      conductor: {
        calibreAWG: circuito.conductor.calibre_awg,
        material: circuito.conductor.material,
        capacidadA: circuito.conductor.capacidad_a
      }
    }));

    return {
      id: resultado.proyecto.id,
      nombre: resultado.proyecto.nombre,
      circuitos: circuitos
    };
  }

  /**
   * Obtiene estadísticas de los resultados
   */
  getEstadisticas(resultado: ResultadoModelado) {
    const circuitos = resultado.circuitos;
    
    // Estadísticas por tipo de circuito
    const tiposCircuito = new Map<string, number>();
    circuitos.forEach(c => {
      tiposCircuito.set(c.tipo, (tiposCircuito.get(c.tipo) || 0) + 1);
    });

    // Estadísticas por ambiente
    const ambientes = new Map<string, number>();
    circuitos.forEach(c => {
      ambientes.set(c.ambiente_nombre, (ambientes.get(c.ambiente_nombre) || 0) + 1);
    });

    // Estadísticas de protecciones
    const protecciones = new Map<string, number>();
    circuitos.forEach(c => {
      const key = `${c.proteccion.tipo} ${c.proteccion.capacidad_a}A ${c.proteccion.curva}`;
      protecciones.set(key, (protecciones.get(key) || 0) + 1);
    });

    // Estadísticas de conductores
    const conductores = new Map<string, number>();
    circuitos.forEach(c => {
      const key = `${c.conductor.calibre_awg} ${c.conductor.material}`;
      conductores.set(key, (conductores.get(key) || 0) + 1);
    });

    return {
      totalCircuitos: resultado.resumen.total_circuitos,
      potenciaTotal: resultado.resumen.potencia_total_va,
      corrienteTotal: resultado.resumen.corriente_total_a,
      ambientesCount: resultado.resumen.ambientes_count,
      tiposCircuito: Array.from(tiposCircuito.entries()).map(([tipo, cantidad]) => ({ tipo, cantidad })),
      ambientes: Array.from(ambientes.entries()).map(([ambiente, cantidad]) => ({ ambiente, cantidad })),
      protecciones: Array.from(protecciones.entries()).map(([proteccion, cantidad]) => ({ proteccion, cantidad })),
      conductores: Array.from(conductores.entries()).map(([conductor, cantidad]) => ({ conductor, cantidad }))
    };
  }

  /**
   * Genera datos para gráficos
   */
  getDatosGraficos(resultado: ResultadoModelado) {
    const circuitos = resultado.circuitos;
    
    // Datos para gráfico de pastel por tipo de circuito
    const datosTipoCircuito = this.agruparPorPropiedad(circuitos, 'tipo', 'potencia_va');
    
    // Datos para gráfico de barras por ambiente
    const datosAmbiente = this.agruparPorPropiedad(circuitos, 'ambiente_nombre', 'potencia_va');
    
    // Datos para gráfico de líneas de distribución de corrientes
    const corrientes = circuitos.map(c => c.corriente_a).sort((a, b) => a - b);
    
    return {
      tipoCircuito: datosTipoCircuito,
      ambiente: datosAmbiente,
      corrientes: corrientes,
      distribucionCorrientes: this.crearDistribucionCorrientes(corrientes)
    };
  }

  /**
   * Agrupa datos por una propiedad específica
   */
  private agruparPorPropiedad<T>(array: T[], propiedad: keyof T, valorPropiedad: keyof T) {
    const grupos = new Map<string, number>();
    
    array.forEach(item => {
      const key = String(item[propiedad]);
      const valor = Number(item[valorPropiedad]) || 1;
      grupos.set(key, (grupos.get(key) || 0) + valor);
    });
    
    return Array.from(grupos.entries()).map(([label, value]) => ({ label, value }));
  }

  /**
   * Crea distribución de corrientes para histograma
   */
  private crearDistribucionCorrientes(corrientes: number[]) {
    if (corrientes.length === 0) return [];
    
    const min = Math.min(...corrientes);
    const max = Math.max(...corrientes);
    const rango = max - min;
    const numBins = Math.min(10, Math.ceil(Math.sqrt(corrientes.length)));
    const binSize = rango / numBins;
    
    const bins = new Array(numBins).fill(0);
    const labels: string[] = [];
    
    for (let i = 0; i < numBins; i++) {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      labels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}A`);
    }
    
    corrientes.forEach(corriente => {
      const binIndex = Math.min(Math.floor((corriente - min) / binSize), numBins - 1);
      bins[binIndex]++;
    });
    
    return labels.map((label, index) => ({
      label,
      value: bins[index]
    }));
  }

  /**
   * Valida que los resultados sean válidos
   */
  validarResultados(resultado: ResultadoModelado): { valido: boolean; errores: string[] } {
    const errores: string[] = [];
    
    if (!resultado.proyecto) {
      errores.push('No se encontró información del proyecto');
    }
    
    if (!resultado.circuitos || resultado.circuitos.length === 0) {
      errores.push('No se encontraron circuitos en el proyecto');
    }
    
    if (resultado.circuitos) {
      resultado.circuitos.forEach((circuito, index) => {
        if (!circuito.proteccion) {
          errores.push(`Circuito ${index + 1}: Falta información de protección`);
        }
        if (!circuito.conductor) {
          errores.push(`Circuito ${index + 1}: Falta información del conductor`);
        }
        if (circuito.corriente_a <= 0) {
          errores.push(`Circuito ${index + 1}: Corriente inválida`);
        }
        if (circuito.potencia_va <= 0) {
          errores.push(`Circuito ${index + 1}: Potencia inválida`);
        }
      });
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }
}
