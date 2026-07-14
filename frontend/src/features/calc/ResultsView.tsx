import { FileWarning } from 'lucide-react';
import type {
  RoomsResponse,
  DemandResponse,
  CircuitsResponse,
  FeederResponse,
  GroundingResponse,
} from '@shared/types/calc.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ResultsViewProps {
  rooms: RoomsResponse | null;
  demand: DemandResponse | null;
  circuits: CircuitsResponse | null;
  feeder: FeederResponse | null;
  grounding: GroundingResponse | null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

export default function ResultsView({
  rooms,
  demand,
  circuits,
  feeder,
  grounding,
}: ResultsViewProps) {
  const hasAny = !!(rooms || demand || circuits || feeder || grounding);

  if (!hasAny) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <FileWarning className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Completa los cálculos para ver los resultados aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rooms && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Habitaciones</CardTitle>
            <Badge variant="secondary">CE-01</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Carga total" value={`${rooms.totales.carga_total_va.toLocaleString()} VA`} />
              <Stat
                label="Diversificada"
                value={`${rooms.totales.carga_diversificada_va.toLocaleString()} VA`}
              />
              <Stat label="Corriente" value={`${rooms.totales.corriente_total_a.toFixed(2)} A`} />
              <Stat label="Ambientes" value={String(rooms.environments.length)} />
            </div>
          </CardContent>
        </Card>
      )}

      {demand && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Demanda</CardTitle>
            <Badge variant="secondary">CE-02</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat
                label="Original"
                value={`${demand.totales_diversificados.carga_total_original_va.toLocaleString()} VA`}
              />
              <Stat
                label="Diversificada"
                value={`${demand.totales_diversificados.carga_total_diversificada_va.toLocaleString()} VA`}
              />
              <Stat
                label="Factor"
                value={`${(demand.totales_diversificados.factor_diversificacion_efectivo * 100).toFixed(1)}%`}
              />
              <Stat
                label="Ahorro"
                value={`${demand.totales_diversificados.porcentaje_ahorro.toFixed(1)}%`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {circuits && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Circuitos</CardTitle>
            <Badge variant="secondary">CE-03</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat label="Total circuitos" value={String(circuits.totales.total_circuitos)} />
              <Stat
                label="Carga total"
                value={`${circuits.totales.carga_total_va.toLocaleString()} VA`}
              />
              <Stat
                label="Corriente total"
                value={`${circuits.totales.corriente_total_a.toFixed(2)} A`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {feeder && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Alimentador</CardTitle>
            <Badge variant="secondary">CE-04</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Calibre" value={`${feeder.alimentador.calibre_awg} AWG`} />
              <Stat label="Sección" value={`${feeder.alimentador.section_mm2} mm²`} />
              <Stat label="Ampacidad" value={`${feeder.alimentador.ampacidad_a} A`} />
              <Stat
                label="Caída tensión"
                value={`${feeder.alimentador.caida_tension_pct.toFixed(2)}%`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {grounding && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Puesta a Tierra</CardTitle>
            <Badge variant="secondary">CE-05</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2 text-sm">
                <h4 className="font-medium text-foreground">Electrodo</h4>
                <Separator />
                <div className="space-y-1 text-muted-foreground">
                  <div>
                    Tipo: <strong className="text-foreground">{grounding.electrodo.tipo}</strong>
                  </div>
                  <div>
                    Cantidad:{' '}
                    <strong className="text-foreground">{grounding.electrodo.cantidad}</strong>
                  </div>
                  <div>
                    Profundidad:{' '}
                    <strong className="text-foreground">
                      {grounding.electrodo.profundidad_m} m
                    </strong>
                  </div>
                  <div>
                    Resistencia:{' '}
                    <strong className="text-foreground">
                      {grounding.electrodo.resistencia_ohm} Ω
                    </strong>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <h4 className="font-medium text-foreground">Conductor</h4>
                <Separator />
                <div className="space-y-1 text-muted-foreground">
                  <div>
                    Sección:{' '}
                    <strong className="text-foreground">
                      {grounding.conductor.section_mm2} mm²
                    </strong>
                  </div>
                  <div>
                    Calibre:{' '}
                    <strong className="text-foreground">
                      {grounding.conductor.calibre_awg} AWG
                    </strong>
                  </div>
                  <div>
                    Material:{' '}
                    <strong className="text-foreground">{grounding.conductor.material}</strong>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
