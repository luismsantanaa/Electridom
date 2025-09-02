# Sprint 18 – Backend (NestJS + MariaDB)
## Objetivo
Implementar el **servicio de selección de protecciones** (breakers térmicos/magnéticos y diferenciales GFCI/AFCI) por circuito, con base en la carga calculada y el calibre del conductor, cumpliendo RIE RD + NEC 2020.

## Entregables
- `ProtectionService` con API REST.
- Reglas de selección de breaker por calibre/carga.
- Detección de zonas GFCI/AFCI (baños, cocinas, lavandería, exteriores).
- Seeds normativos: **calibre ↔ corriente admisible**, **reglas GFCI/AFCI**.
- Pruebas unitarias básicas.

## Endpoints (nuevos)
- `GET /api/protections/:circuitId` → Devuelve protección propuesta del circuito.
- `POST /api/protections/recalculate` → Body: `{ projectId }`, recalcula todas las protecciones.
- `GET /api/protections/project/:projectId` → Lista protecciones de todos los circuitos.

## Modelos/Entidades
- `circuit` (ya existente): id, projectId, loadVA, conductorGauge, areaType, phase, ...  
- `protection`: id, circuitId (FK), breakerAmp, breakerType ("MCB"), differentialType ("GFCI" | "AFCI" | "NONE"), notes.

SQL (MariaDB) ejemplo creación:
```sql
CREATE TABLE IF NOT EXISTS protection (
  id INT AUTO_INCREMENT PRIMARY KEY,
  circuitId INT NOT NULL,
  breakerAmp INT NOT NULL,
  breakerType VARCHAR(16) NOT NULL DEFAULT 'MCB',
  differentialType VARCHAR(8) NOT NULL DEFAULT 'NONE',
  notes VARCHAR(255) NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_protection_circuit FOREIGN KEY (circuitId) REFERENCES circuit(id)
);
```

## Lógica de selección (resumen)
1. Determinar **corriente del circuito**: `I = VA / (V_linea)` (usa 120V o 240V según tipo).  
2. Tomar el **calibre** del conductor (`conductorGauge`) y su **corriente admisible** (seed).  
3. Elegir **breaker** con el **siguiente valor estándar** ≥ I, **pero ≤ corriente admisible** del conductor.  
4. Aplicar **GFCI/AFCI** según `areaType` y tipo de carga.
5. Registrar/actualizar en `protection`.

## Pseudocódigo
```ts
const stdBreakers = [15, 20, 25, 30, 40, 50, 60]; // A
function pickBreaker(currentA: number, ampacityA: number): number {
  for (const b of stdBreakers) {
    if (b >= currentA and b <= ampacityA) return b;
  }
  // Si ninguno aplica, devolver el más cercano permitido por ampacidad
  return Math.min(ampacityA, Math.max(...stdBreakers.filter(x => x <= ampacityA)));
}
```

## Criterios de aceptación
- Dado un circuito de 1500 VA @120V con conductor 2.0 mm² (ampacidad ≥ 20A), el sistema propone breaker **15–20A** y no sobrepasa la ampacidad de conductor.
- Zonas **baño, cocina, lavandería, exteriores**: proponer **GFCI**. Dormitorios/áreas de descanso susceptibles: **AFCI**.
- Endpoints responden en < 500 ms con 100 circuitos.

## Tareas
1. Servicio `ProtectionService` y `ProtectionRepository` (TypeORM).
2. Implementar utilidades de cálculo (ampacidad, corriente, selección estándar).
3. Controladores REST y DTOs con validación `class-validator`.
4. Integrar seeders (`typeorm-seeding` o script SQL) para normativas.
5. Pruebas unitarias simples (Jest) para la lógica de selección.
6. Documentar en Swagger (si está habilitado).

## Notas para Cursor
- Respetar arquitectura modular: `modules/protection`, `modules/circuit`.
- No modificar entidades existentes sin migración correspondiente.
