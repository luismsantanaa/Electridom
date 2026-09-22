import { useState, useCallback } from 'react';
import {
  Download,
  FileJson,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  getUnifilarAdvanced,
  downloadUnifilarPDF,
  downloadUnifilarJSON,
  downloadBlob,
} from '@/shared/api/unifilar.api';
import type {
  UnifilarAdvancedExport,
  PhaseBalance,
  UnifilarPanel,
} from '@/shared/types/unifilar.types';

// ─── Phase Indicator Component ─────────────────────────────────────────────

function PhaseIndicator({
  label,
  loadVA,
  maxLoad,
  color,
}: {
  label: string;
  loadVA: number;
  maxLoad: number;
  color: string;
}) {
  const pct = maxLoad > 0 ? (loadVA / maxLoad) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Fase {label}</span>
        <span className="tabular-nums text-muted-foreground">
          {loadVA.toLocaleString()} VA
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Phase Balance Card ─────────────────────────────────────────────────────

function PhaseBalanceCard({ balance }: { balance: PhaseBalance }) {
  const maxLoad = Math.max(
    balance.totalLoad.A ?? 0,
    balance.totalLoad.B ?? 0,
    balance.totalLoad.C ?? 0
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-4" />
          Balance de Fases
        </CardTitle>
        <Badge variant={balance.isBalanced ? 'default' : 'destructive'}>
          {balance.isBalanced ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Balanceado
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <AlertTriangle className="size-3" /> Desbalanceado
            </span>
          )}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <PhaseIndicator
            label="A"
            loadVA={balance.totalLoad.A ?? 0}
            maxLoad={maxLoad}
            color="bg-blue-500"
          />
          <PhaseIndicator
            label="B"
            loadVA={balance.totalLoad.B ?? 0}
            maxLoad={maxLoad}
            color="bg-amber-500"
          />
          <PhaseIndicator
            label="C"
            loadVA={balance.totalLoad.C ?? 0}
            maxLoad={maxLoad}
            color="bg-emerald-500"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Desbalance máximo</span>
          <span
            className={`font-bold tabular-nums ${
              balance.isBalanced ? 'text-emerald-600' : 'text-destructive'
            }`}
          >
            {balance.maxImbalance.toFixed(1)}%
          </span>
        </div>

        {balance.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Recomendaciones
            </p>
            <ul className="space-y-1">
              {balance.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <Zap className="mt-0.5 size-3 shrink-0 text-amber-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Unifilar Preview (SVG) ────────────────────────────────────────────────

function UnifilarPreview({ data }: { data: UnifilarAdvancedExport }) {
  const panel = data.panels[0];
  if (!panel) return null;

  const circuitWidth = 100;
  const circuitHeight = 60;
  const gap = 16;
  const cols = Math.min(4, panel.circuits.length);
  const rows = Math.ceil(panel.circuits.length / cols);
  const svgWidth = cols * (circuitWidth + gap) + gap * 2 + 40;
  const svgHeight = rows * (circuitHeight + gap) + gap * 3 + 120;

  const phaseColors: Record<string, string> = {
    A: '#3b82f6',
    B: '#f59e0b',
    C: '#10b981',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="size-4" />
          Vista Previa — {panel.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border bg-muted/30 p-4">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="mx-auto"
          >
            {/* Main bus */}
            <rect
              x={gap}
              y={gap}
              width={svgWidth - gap * 2}
              height={8}
              rx={4}
              className="fill-foreground"
            />
            <text
              x={svgWidth / 2}
              y={gap - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px] font-medium"
            >
              {panel.name} — {panel.amperage}A — {panel.voltage}
            </text>

            {/* Circuits */}
            {panel.circuits.map((circuit, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const x = gap + col * (circuitWidth + gap) + 20;
              const y = gap * 2 + 16 + row * (circuitHeight + gap);
              const color = phaseColors[circuit.phase] ?? '#6b7280';

              return (
                <g key={circuit.id}>
                  {/* Drop line from bus */}
                  <line
                    x1={x + circuitWidth / 2}
                    y1={gap + 8}
                    x2={x + circuitWidth / 2}
                    y2={y}
                    stroke={color}
                    strokeWidth={2}
                  />

                  {/* Circuit box */}
                  <rect
                    x={x}
                    y={y}
                    width={circuitWidth}
                    height={circuitHeight}
                    rx={6}
                    className="fill-card stroke-border"
                    strokeWidth={1.5}
                  />

                  {/* Phase indicator dot */}
                  <circle cx={x + 10} cy={y + 12} r={4} fill={color} />

                  {/* Circuit info */}
                  <text
                    x={x + 18}
                    y={y + 15}
                    className="fill-foreground text-[9px] font-bold"
                  >
                    CKT-{circuit.id}
                  </text>
                  <text
                    x={x + circuitWidth / 2}
                    y={y + 30}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[8px]"
                  >
                    {circuit.breakerAmp}A {circuit.breakerType}
                  </text>
                  <text
                    x={x + circuitWidth / 2}
                    y={y + 42}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[8px]"
                  >
                    {circuit.loadVA} VA
                  </text>
                  <text
                    x={x + circuitWidth / 2}
                    y={y + 54}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[7px]"
                  >
                    {circuit.areaType}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {Object.entries(phaseColors).map(([phase, color]) => (
            <span key={phase} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              Fase {phase}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Panel Info ─────────────────────────────────────────────────────────────

function PanelInfo({ panel }: { panel: UnifilarPanel }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{panel.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/60 p-2.5">
            <div className="text-xs text-muted-foreground">Tipo</div>
            <div className="mt-0.5 text-sm font-bold">{panel.type}</div>
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5">
            <div className="text-xs text-muted-foreground">Amperaje</div>
            <div className="mt-0.5 text-sm font-bold tabular-nums">
              {panel.amperage}A
            </div>
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5">
            <div className="text-xs text-muted-foreground">Voltaje</div>
            <div className="mt-0.5 text-sm font-bold">{panel.voltage}</div>
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5">
            <div className="text-xs text-muted-foreground">Circuitos</div>
            <div className="mt-0.5 text-sm font-bold tabular-nums">
              {panel.circuits.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface UnifilarAdvancedExportProps {
  projectId: number;
  projectName?: string;
}

export default function UnifilarAdvancedExport({
  projectId,
  projectName,
}: UnifilarAdvancedExportProps) {
  const [data, setData] = useState<UnifilarAdvancedExport | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUnifilarAdvanced(projectId);
      setData(result);
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? 'Error al cargar el diagrama unifilar'
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleDownload = useCallback(
    async (format: 'pdf' | 'json') => {
      setDownloading(true);
      try {
        const blob =
          format === 'pdf'
            ? await downloadUnifilarPDF(projectId)
            : await downloadUnifilarJSON(projectId);

        const ext = format === 'pdf' ? 'pdf' : 'json';
        const name = projectName ?? `proyecto-${projectId}`;
        downloadBlob(blob, `unifilar-${name}.${ext}`);
      } catch (err: any) {
        setError(
          err.response?.data?.message ?? `Error al descargar ${format.toUpperCase()}`
        );
      } finally {
        setDownloading(false);
      }
    },
    [projectId, projectName]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Diagrama Unifilar Avanzado
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {projectName ?? `Proyecto #${projectId}`} — Exportación con balance
            de fases
          </p>
        </div>

        <div className="flex gap-2">
          {!data && (
            <Button onClick={loadData} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Zap className="mr-2 size-4" />
              )}
              Generar Diagrama
            </Button>
          )}

          {data && (
            <>
              <Button
                variant="outline"
                onClick={() => handleDownload('json')}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <FileJson className="mr-2 size-4" />
                )}
                Descargar JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownload('pdf')}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 size-4" />
                )}
                Descargar PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="size-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Generando diagrama unifilar...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Preview + Panel Info */}
          <div className="space-y-6 lg:col-span-2">
            <UnifilarPreview data={data} />
            {data.panels.map((panel) => (
              <PanelInfo key={panel.id} panel={panel} />
            ))}
          </div>

          {/* Right: Phase Balance */}
          <div className="space-y-6">
            <PhaseBalanceCard balance={data.phaseBalance} />

            {/* Metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Metadatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Circuitos</span>
                  <span className="font-bold tabular-nums">
                    {data.metadata.totalCircuits}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carga total</span>
                  <span className="font-bold tabular-nums">
                    {data.metadata.totalLoadVA.toLocaleString()} VA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicio</span>
                  <span className="font-bold">{data.service.voltage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fases</span>
                  <span className="font-bold">{data.service.phases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generado</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(data.metadata.generatedAt).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Download className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Genera el diagrama unifilar avanzado para visualizarlo y
              exportarlo en PDF o JSON.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
