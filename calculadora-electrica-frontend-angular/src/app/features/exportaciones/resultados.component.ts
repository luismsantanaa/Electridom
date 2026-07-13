import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { DataGridComponent, DataGridColumn, DataGridAction } from '../../shared/components/data-grid/data-grid.component';
import { ResultadosService, ResultadoModelado } from '../../core/services/resultados.service';
import { ExportService, CircuitoResultado } from '../../core/services/export.service';
import { UnifilarService } from '../../core/services/unifilar.service';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.css']
})
export class ResultadosComponent implements OnInit {
  // Signals
  resultado = signal<ResultadoModelado | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  exportando = signal<boolean>(false);
  unifilarSvg = signal<string | null>(null);

  // Computed properties
  estadisticas = computed(() => {
    const resultado = this.resultado();
    if (!resultado) {
      return {
        totalCircuitos: 0,
        potenciaTotal: 0,
        corrienteTotal: 0,
        ambientesCount: 0,
        tiposCircuito: [],
        ambientes: [],
        protecciones: [],
        conductores: []
      };
    }
    return this.resultadosService.getEstadisticas(resultado);
  });

  // DataGrid configuration
  circuitosColumns: DataGridColumn[] = [
    { key: 'ambiente_nombre', label: 'Ambiente', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'potencia_va', label: 'Potencia (VA)', sortable: true, type: 'number' },
    { key: 'corriente_a', label: 'Corriente (A)', sortable: true, type: 'number' },
    { key: 'proteccion', label: 'Protección', sortable: false, type: 'text' },
    { key: 'conductor', label: 'Conductor', sortable: false, type: 'text' }
  ];

  circuitosActions: DataGridAction[] = [
    {
      label: 'Ver Detalles',
      icon: 'fas fa-eye',
      type: 'custom'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private resultadosService: ResultadosService,
    private exportService: ExportService,
    private unifilarService: UnifilarService
  ) {}

  ngOnInit() {
    this.cargarResultados();
  }

  async cargarResultados() {
    const proyectoId = this.route.snapshot.paramMap.get('id');
    if (!proyectoId) {
      this.error.set('ID de proyecto no válido');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const resultado = await this.resultadosService.getResultados(Number(proyectoId)).toPromise();
      if (!resultado) {
        throw new Error('No se pudieron cargar los resultados');
      }

      // Validar resultados
      const validacion = this.resultadosService.validarResultados(resultado);
      if (!validacion.valido) {
        throw new Error(`Errores en los resultados: ${validacion.errores.join(', ')}`);
      }

      this.resultado.set(resultado);

      // Generar unifilar
      const proyectoResultado = this.resultadosService.convertToProyectoResultado(resultado);
      const unifilarSvg = this.unifilarService.generateUnifilar(proyectoResultado);
      this.unifilarSvg.set(unifilarSvg);

    } catch (err: any) {
      console.error('Error al cargar resultados:', err);
      this.error.set(err.message || 'Error al cargar los resultados');
    } finally {
      this.loading.set(false);
    }
  }

  verDetalles(circuito: any) {
    // Implementar vista de detalles del circuito
    console.log('Ver detalles del circuito:', circuito);
  }

  // DataGrid data source
  get circuitosDataSource() {
    return async (query: any) => {
      const resultado = this.resultado();
      if (!resultado) {
        return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
      }

      let circuitos = [...resultado.circuitos];

      // Aplicar búsqueda
      if (query.search) {
        const search = query.search.toLowerCase();
        circuitos = circuitos.filter(c => 
          c.ambiente_nombre.toLowerCase().includes(search) ||
          c.tipo.toLowerCase().includes(search)
        );
      }

      // Aplicar ordenamiento
      if (query.sortBy) {
        circuitos.sort((a, b) => {
          const aVal = a[query.sortBy as keyof typeof a];
          const bVal = b[query.sortBy as keyof typeof b];
          
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return query.sortOrder === 'desc' ? 
              bVal.localeCompare(aVal) : 
              aVal.localeCompare(bVal);
          }
          
          return query.sortOrder === 'desc' ? 
            Number(bVal) - Number(aVal) : 
            Number(aVal) - Number(bVal);
        });
      }

      // Aplicar paginación
      const start = (query.page - 1) * query.pageSize;
      const end = start + query.pageSize;
      const data = circuitos.slice(start, end);

      return {
        data,
        total: circuitos.length,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(circuitos.length / query.pageSize)
      };
    };
  }

  async exportarPDF() {
    if (!this.resultado()) return;

    this.exportando.set(true);
    try {
      const proyectoResultado = this.resultadosService.convertToProyectoResultado(this.resultado()!);
      proyectoResultado.unifilarSvg = this.unifilarSvg() || undefined;
      await this.exportService.toPDF(proyectoResultado);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar PDF');
    } finally {
      this.exportando.set(false);
    }
  }

  exportarExcel() {
    if (!this.resultado()) return;

    this.exportando.set(true);
    try {
      const proyectoResultado = this.resultadosService.convertToProyectoResultado(this.resultado()!);
      this.exportService.toExcel(proyectoResultado);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar Excel');
    } finally {
      this.exportando.set(false);
    }
  }

  async exportarUnifilar() {
    if (!this.unifilarSvg()) return;

    this.exportando.set(true);
    try {
      const filename = `unifilar-proyecto-${this.resultado()?.proyecto.id}-${new Date().toISOString().split('T')[0]}.png`;
      await this.exportService.exportUnifilarAsImage(this.unifilarSvg()!, filename);
    } catch (error) {
      console.error('Error al exportar unifilar:', error);
      alert('Error al exportar diagrama unifilar');
    } finally {
      this.exportando.set(false);
    }
  }

  verValidaciones() {
    if (this.resultado()?.proyecto?.id) {
      this.router.navigate(['/proyectos', this.resultado()!.proyecto.id, 'validaciones']);
    }
  }
}
