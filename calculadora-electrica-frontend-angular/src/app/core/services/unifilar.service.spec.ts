import { TestBed } from '@angular/core/testing';
import { UnifilarService } from './unifilar.service';
import { ProyectoResultado } from './export.service';

describe('UnifilarService', () => {
  let service: UnifilarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnifilarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateUnifilar', () => {
    it('should generate SVG unifilar diagram', () => {
      const mockProyecto: ProyectoResultado = {
        id: 1,
        nombre: 'Proyecto Test',
        circuitos: [
          {
            id: 1,
            ambienteId: 1,
            ambienteNombre: 'Sala',
            tipo: 'TUG',
            potenciaVA: 1800,
            corrienteA: 8.2,
            proteccion: {
              tipo: 'MCB',
              capacidadA: 15,
              curva: 'C'
            },
            conductor: {
              calibreAWG: '14',
              material: 'Cu',
              capacidadA: 15
            }
          }
        ]
      };

      const svg = service.generateUnifilar(mockProyecto);
      
      expect(svg).toBeTruthy();
      expect(svg).toContain('<svg');
      expect(svg).toContain('Panel Principal');
      expect(svg).toContain('C1');
    });

    it('should handle empty project', () => {
      const mockProyecto: ProyectoResultado = {
        id: 1,
        nombre: 'Proyecto Vacío',
        circuitos: []
      };

      const svg = service.generateUnifilar(mockProyecto);
      
      expect(svg).toBeTruthy();
      expect(svg).toContain('<svg');
      expect(svg).toContain('Panel Principal');
    });
  });

  describe('generateSimplifiedUnifilar', () => {
    it('should generate simplified diagram for large projects', () => {
      const mockProyecto: ProyectoResultado = {
        id: 1,
        nombre: 'Proyecto Grande',
        circuitos: [
          {
            id: 1,
            ambienteId: 1,
            ambienteNombre: 'Sala',
            tipo: 'TUG',
            potenciaVA: 1800,
            corrienteA: 8.2,
            proteccion: {
              tipo: 'MCB',
              capacidadA: 15,
              curva: 'C'
            },
            conductor: {
              calibreAWG: '14',
              material: 'Cu',
              capacidadA: 15
            }
          },
          {
            id: 2,
            ambienteId: 2,
            ambienteNombre: 'Cocina',
            tipo: 'TUG',
            potenciaVA: 2400,
            corrienteA: 10.9,
            proteccion: {
              tipo: 'MCB',
              capacidadA: 20,
              curva: 'C'
            },
            conductor: {
              calibreAWG: '12',
              material: 'Cu',
              capacidadA: 20
            }
          }
        ]
      };

      const svg = service.generateSimplifiedUnifilar(mockProyecto);
      
      expect(svg).toBeTruthy();
      expect(svg).toContain('<svg');
      expect(svg).toContain('TUG');
    });
  });
});
