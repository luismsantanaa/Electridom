import { useState, useCallback } from 'react';
import { Check, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DetectedSpace } from '@shared/types/plan.types';
import { SPACE_TYPE_LABELS } from '@shared/types/plan.types';
import { plansApi } from '@shared/api/plans.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PaginationControls } from '@/shared/components/PaginationControls';
import { useClientPagination } from '@/shared/hooks/useClientPagination';

interface SpaceEditorProps {
  planId: string;
  spaces: DetectedSpace[];
  onSpacesChange: (spaces: DetectedSpace[]) => void;
}

export default function SpaceEditor({ planId, spaces, onSpacesChange }: SpaceEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    from,
    to,
    pageItems,
  } = useClientPagination(spaces, 10);

  const handleVerify = useCallback(
    async (spaceId: string) => {
      setSavingId(spaceId);
      try {
        const updated = await plansApi.updateSpace(planId, spaceId, { is_verified: true });
        onSpacesChange(spaces.map((s) => (s.id === spaceId ? updated : s)));
        toast.success('Espacio verificado');
      } catch {
        toast.error('No se pudo verificar el espacio');
      } finally {
        setSavingId(null);
      }
    },
    [planId, spaces, onSpacesChange],
  );

  const handleNameSave = useCallback(
    async (spaceId: string) => {
      setSavingId(spaceId);
      try {
        const updated = await plansApi.updateSpace(planId, spaceId, { name: editName });
        onSpacesChange(spaces.map((s) => (s.id === spaceId ? updated : s)));
        setEditingId(null);
        toast.success('Nombre actualizado');
      } catch {
        toast.error('No se pudo actualizar el nombre');
      } finally {
        setSavingId(null);
      }
    },
    [planId, spaces, editName, onSpacesChange],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await plansApi.updateSpace(planId, deleteId, { vertices: [] });
      onSpacesChange(spaces.filter((s) => s.id !== deleteId));
      toast.success('Espacio eliminado');
      setDeleteId(null);
    } catch {
      toast.error('No se pudo eliminar el espacio');
    } finally {
      setDeleting(false);
    }
  }, [deleteId, planId, spaces, onSpacesChange]);

  const verifiedCount = spaces.filter((s) => s.is_verified).length;
  const avgConfidence =
    spaces.length > 0
      ? spaces.reduce((sum, s) => sum + s.confidence, 0) / spaces.length
      : 0;

  const deleteTarget = spaces.find((s) => s.id === deleteId);

  return (
    <>
      <Card>
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base">
            Espacios detectados ({spaces.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Verificados: {verifiedCount}/{spaces.length} · Confianza promedio:{' '}
            {(avgConfidence * 100).toFixed(0)}%
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {pageItems.map((space) => (
              <div
                key={space.id}
                className={cn(
                  'flex items-start justify-between gap-2 rounded-lg border p-3 transition-colors',
                  space.is_verified
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/30',
                )}
              >
                <div className="min-w-0 flex-1">
                  {editingId === space.id ? (
                    <div className="flex flex-wrap gap-2">
                      <Input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        aria-label="Nombre del espacio"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleNameSave(space.id)}
                        disabled={savingId === space.id}
                      >
                        {savingId === space.id && (
                          <Loader2 className="size-3.5 animate-spin" />
                        )}
                        Guardar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="group flex w-full items-center gap-2 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        setEditingId(space.id);
                        setEditName(space.name);
                      }}
                    >
                      <span className="truncate text-sm font-medium text-foreground">
                        {SPACE_TYPE_LABELS[space.space_type || 'unknown'] || space.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {space.area_m2.toFixed(1)} m²
                      </span>
                      {space.is_verified && (
                        <Badge variant="secondary" className="shrink-0 gap-1">
                          <Check className="size-3" />
                          Verificado
                        </Badge>
                      )}
                      <Pencil className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">
                    Confianza: {(space.confidence * 100).toFixed(0)}% ·{' '}
                    {space.classification_method}
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  {!space.is_verified && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleVerify(space.id)}
                      disabled={savingId === space.id}
                    >
                      {savingId === space.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Verificar
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(space.id)}
                    aria-label={`Eliminar ${space.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {spaces.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay espacios detectados. Sube un plano para comenzar.
            </p>
          ) : (
            <PaginationControls
              idPrefix="space-editor"
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              from={from}
              to={to}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar espacio</DialogTitle>
            <DialogDescription>
              ¿Eliminar “
              {deleteTarget
                ? SPACE_TYPE_LABELS[deleteTarget.space_type || 'unknown'] ||
                  deleteTarget.name
                : ''}
              ”? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
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
    </>
  );
}
