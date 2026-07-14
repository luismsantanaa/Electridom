import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  FileStack,
  Loader2,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import PlanUploader from './PlanUploader';
import PlanViewer from './PlanViewer';
import SpaceEditor from './SpaceEditor';
import SpaceGraphics from './SpaceGraphics';
import { plansApi } from '@shared/api/plans.api';
import type { DetectedSpace, PlanListItem } from '@shared/types/plan.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Phase = 'upload' | 'processing' | 'review';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
};

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('upload');
  const [planId, setPlanId] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [spaces, setSpaces] = useState<DetectedSpace[]>([]);
  const [viewMode, setViewMode] = useState<'viewer' | 'graphics'>('viewer');
  const [graphicsMode, setGraphicsMode] = useState<'treemap' | 'bubble'>('treemap');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<PlanListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    data: plansData,
    isLoading: plansLoading,
    isError: plansError,
    isFetching: plansFetching,
  } = useQuery({
    queryKey: ['plans', { page, pageSize }],
    queryFn: () => plansApi.list({ page, pageSize }),
    enabled: phase === 'upload',
  });

  const total = plansData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  useEffect(() => {
    if (!planId || phase !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const status = await plansApi.getStatus(planId);
        if (status.processing_status === 'completed') {
          const result = await plansApi.getResult(planId);
          setSpaces(result.spaces);
          setPhase('review');
          toast.success(
            `Procesamiento listo: ${result.spaces.length} espacio(s) detectado(s)`,
          );
          void queryClient.invalidateQueries({ queryKey: ['plans'] });
          clearInterval(interval);
        } else if (status.processing_status === 'failed') {
          toast.error(
            'Error al procesar el plano: ' + (status.error_message || 'Desconocido'),
          );
          setPhase('upload');
          setPlanId(null);
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [planId, phase, queryClient]);

  const handleUploadComplete = useCallback((id: string, name: string) => {
    setPlanId(id);
    setFilename(name);
    setPhase('processing');
  }, []);

  const handleSpacesChange = useCallback((updatedSpaces: DetectedSpace[]) => {
    setSpaces(updatedSpaces);
  }, []);

  const handleReset = useCallback(() => {
    setPhase('upload');
    setPlanId(null);
    setFilename('');
    setSpaces([]);
  }, []);

  const openPlan = useCallback(async (item: PlanListItem) => {
    if (item.processing_status === 'processing' || item.processing_status === 'pending') {
      setPlanId(item.id);
      setFilename(item.original_filename);
      setPhase('processing');
      return;
    }
    if (item.processing_status !== 'completed') {
      toast.error('Este plano no se puede revisar en su estado actual');
      return;
    }
    try {
      const result = await plansApi.getResult(item.id);
      setPlanId(item.id);
      setFilename(item.original_filename);
      setSpaces(result.spaces);
      setPhase('review');
    } catch {
      toast.error('No se pudo cargar el plano');
    }
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await plansApi.delete(deleteTarget.id);
      toast.success(`Plano "${deleteTarget.original_filename}" eliminado`);
      setDeleteTarget(null);
      if ((plansData?.items.length ?? 0) <= 1 && page > 1) {
        setPage(page - 1);
      }
      await queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch {
      toast.error('No se pudo eliminar el plano');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 motion-safe:animate-[fadeIn_200ms_ease-out]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Planos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube PDF/DXF y revisa espacios detectados
          </p>
        </div>
        {phase !== 'upload' && (
          <Button variant="outline" onClick={handleReset}>
            <ChevronLeft className="size-4" />
            Subir otro plano
          </Button>
        )}
      </div>

      {phase === 'upload' && (
        <div className="space-y-6">
          <div className="mx-auto max-w-2xl">
            <PlanUploader onUploadComplete={handleUploadComplete} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planos recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plansError && (
                <Alert variant="destructive">
                  <AlertDescription>Error al cargar la lista de planos.</AlertDescription>
                </Alert>
              )}

              {plansLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !plansData?.items.length ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <FileStack className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aún no hay planos. Sube el primero arriba.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                          <th className="px-4 py-3 text-left font-medium">Archivo</th>
                          <th className="px-4 py-3 text-left font-medium">Tipo</th>
                          <th className="px-4 py-3 text-left font-medium">Estado</th>
                          <th className="px-4 py-3 text-left font-medium">Espacios</th>
                          <th className="px-4 py-3 text-left font-medium">Fecha</th>
                          <th className="px-4 py-3 text-right font-medium">
                            <span className="sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className={plansFetching ? 'opacity-60' : undefined}>
                        {plansData.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                          >
                            <td className="px-4 py-3 font-medium text-foreground">
                              <button
                                type="button"
                                className="text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                onClick={() => void openPlan(item)}
                              >
                                {item.original_filename}
                              </button>
                            </td>
                            <td className="px-4 py-3 uppercase text-muted-foreground">
                              {item.file_type}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  item.processing_status === 'completed'
                                    ? 'default'
                                    : item.processing_status === 'failed'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {STATUS_LABEL[item.processing_status] ||
                                  item.processing_status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 tabular-nums text-muted-foreground">
                              {item.space_count}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Acciones de ${item.original_filename}`}
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => void openPlan(item)}>
                                    Abrir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteTarget(item)}
                                  >
                                    <Trash2 className="size-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {total === 0
                        ? '0 resultados'
                        : `Mostrando ${from}–${to} de ${total}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="plans-page-size"
                          className="whitespace-nowrap text-muted-foreground"
                        >
                          Por página
                        </Label>
                        <Select
                          value={String(pageSize)}
                          onValueChange={(v) => {
                            setPage(1);
                            setPageSize(Number(v));
                          }}
                        >
                          <SelectTrigger id="plans-page-size" className="w-[72px]" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1 || plansFetching}
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="size-4" />
                          Anterior
                        </Button>
                        <span className="min-w-[7rem] px-2 text-center text-sm tabular-nums text-muted-foreground">
                          Página {page} de {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages || plansFetching}
                          aria-label="Página siguiente"
                        >
                          Siguiente
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {phase === 'processing' && (
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 className="size-12 animate-spin text-primary" />
            <h2 className="text-lg font-medium text-foreground">Procesando plano…</h2>
            <p className="text-muted-foreground">{filename}</p>
            <p className="text-sm text-muted-foreground">
              Detectando espacios automáticamente. Esto puede tardar unos segundos.
            </p>
          </CardContent>
        </Card>
      )}

      {phase === 'review' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'viewer' | 'graphics')}
            >
              <TabsList>
                <TabsTrigger value="viewer">Visor 2D</TabsTrigger>
                <TabsTrigger value="graphics">Gráfica</TabsTrigger>
              </TabsList>
            </Tabs>
            {viewMode === 'graphics' && (
              <Tabs
                value={graphicsMode}
                onValueChange={(v) => setGraphicsMode(v as 'treemap' | 'bubble')}
              >
                <TabsList>
                  <TabsTrigger value="treemap">Treemap</TabsTrigger>
                  <TabsTrigger value="bubble">Burbujas</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <Badge variant="secondary" className="ml-auto">
              {filename}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {viewMode === 'viewer' ? (
                <PlanViewer spaces={spaces} mode="view" />
              ) : (
                <SpaceGraphics spaces={spaces} viewMode={graphicsMode} />
              )}
            </div>

            <div className="space-y-4 lg:col-span-1">
              {planId && (
                <SpaceEditor
                  planId={planId}
                  spaces={spaces}
                  onSpacesChange={handleSpacesChange}
                />
              )}

              {spaces.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Estadísticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-muted/60 p-3">
                        <div className="text-xs text-muted-foreground">Total espacios</div>
                        <div className="font-bold tabular-nums">{spaces.length}</div>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-3">
                        <div className="text-xs text-muted-foreground">Área total</div>
                        <div className="font-bold tabular-nums">
                          {spaces.reduce((sum, s) => sum + s.area_m2, 0).toFixed(1)} m²
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-3">
                        <div className="text-xs text-muted-foreground">Verificados</div>
                        <div className="font-bold tabular-nums">
                          {spaces.filter((s) => s.is_verified).length}
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-3">
                        <div className="text-xs text-muted-foreground">Confianza prom.</div>
                        <div className="font-bold tabular-nums">
                          {(
                            (spaces.reduce((sum, s) => sum + s.confidence, 0) /
                              spaces.length) *
                            100
                          ).toFixed(0)}
                          %
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar plano</DialogTitle>
            <DialogDescription>
              ¿Eliminar “{deleteTarget?.original_filename}”? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
