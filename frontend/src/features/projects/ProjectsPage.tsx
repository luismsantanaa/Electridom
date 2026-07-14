import { useState, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
} from './useProjects';
import type {
  ProjectListParams,
  CreateProjectRequest,
  ProjectSummary,
} from '@shared/types/project.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

type SortField = 'projectName' | 'createdAt' | 'status' | 'updatedAt';

function SortIcon({
  field,
  sort,
  order,
}: {
  field: SortField;
  sort?: string;
  order?: 'asc' | 'desc';
}) {
  if (sort !== field) {
    return <ArrowUpDown className="size-3.5 text-muted-foreground/60" aria-hidden />;
  }
  return order === 'asc' ? (
    <ArrowUp className="size-3.5 text-primary" aria-hidden />
  ) : (
    <ArrowDown className="size-3.5 text-primary" aria-hidden />
  );
}

function ProjectsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="hidden h-4 w-48 sm:block" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="ml-auto h-4 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const [params, setParams] = useState<ProjectListParams>({
    page: 1,
    pageSize: 10,
    sort: 'createdAt',
    order: 'desc',
  });
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);
  const [form, setForm] = useState<CreateProjectRequest>({
    projectName: '',
    description: '',
    surfaces: [],
    consumptions: [],
    computeNow: false,
  });

  const { data, isLoading, isError, isFetching } = useProjects(params);
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setParams((prev) => ({
      ...prev,
      page: 1,
      q: search.trim() || undefined,
    }));
  };

  const toggleSort = (field: SortField) => {
    setParams((prev) => {
      if (prev.sort === field) {
        return {
          ...prev,
          order: prev.order === 'asc' ? 'desc' : 'asc',
          page: 1,
        };
      }
      return { ...prev, sort: field, order: 'asc', page: 1 };
    });
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({
          projectName: '',
          description: '',
          surfaces: [],
          consumptions: [],
          computeNow: false,
        });
        toast.success('Proyecto creado');
      },
      onError: () => toast.error('No se pudo crear el proyecto'),
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.projectId, {
      onSuccess: () => {
        toast.success(`Proyecto "${deleteTarget.projectName}" eliminado`);
        setDeleteTarget(null);
        // Si la página queda vacía, retroceder
        if (data?.data.length === 1 && page > 1) {
          setParams((prev) => ({ ...prev, page: page - 1 }));
        }
      },
      onError: () => toast.error('No se pudo eliminar el proyecto'),
    });
  };

  return (
    <div className="space-y-6 motion-safe:animate-[fadeIn_200ms_ease-out]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Proyectos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tus proyectos eléctricos NEC 2023
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nuevo proyecto
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Listado</CardTitle>
            <form onSubmit={handleSearch} className="flex w-full gap-2 sm:max-w-sm">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar proyectos..."
                  className="pl-9"
                  aria-label="Buscar proyectos"
                />
              </div>
              <Button type="submit" variant="secondary">
                Buscar
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError && (
            <Alert variant="destructive">
              <AlertDescription>Error al cargar proyectos.</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <ProjectsTableSkeleton rows={pageSize > 5 ? 5 : pageSize} />
          ) : data && data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <FolderKanban className="size-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">No hay proyectos</p>
                <p className="text-sm text-muted-foreground">
                  {params.q
                    ? `Sin resultados para “${params.q}”. Prueba otra búsqueda.`
                    : 'Crea tu primer proyecto para comenzar.'}
                </p>
              </div>
              {!params.q && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  Nuevo proyecto
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort('projectName')}
                          className="inline-flex items-center gap-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          Nombre
                          <SortIcon
                            field="projectName"
                            sort={params.sort}
                            order={params.order}
                          />
                        </button>
                      </th>
                      <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort('status')}
                          className="inline-flex items-center gap-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          Estado
                          <SortIcon field="status" sort={params.sort} order={params.order} />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSort('createdAt')}
                          className="inline-flex items-center gap-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          Creado
                          <SortIcon
                            field="createdAt"
                            sort={params.sort}
                            order={params.order}
                          />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Versión</th>
                      <th className="px-4 py-3 text-right font-medium">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className={cn(isFetching && !isLoading && 'opacity-60')}>
                    {data?.data.map((project) => (
                      <tr
                        key={project.projectId}
                        className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {project.projectName}
                        </td>
                        <td className="hidden max-w-[240px] truncate px-4 py-3 text-muted-foreground md:table-cell">
                          {project.description || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}
                          >
                            {project.status === 'ACTIVE' ? 'Activo' : 'Archivado'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {project.latestVersion
                            ? `v${project.latestVersion.versionNumber}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Acciones de ${project.projectName}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteTarget(project)}
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

              {/* Paginación */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {total === 0
                    ? '0 resultados'
                    : `Mostrando ${from}–${to} de ${total}`}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="page-size" className="whitespace-nowrap text-muted-foreground">
                      Por página
                    </Label>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(v) =>
                        setParams((prev) => ({
                          ...prev,
                          page: 1,
                          pageSize: Number(v),
                        }))
                      }
                    >
                      <SelectTrigger id="page-size" className="w-[72px]" size="sm">
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
                      onClick={() =>
                        setParams((prev) => ({
                          ...prev,
                          page: Math.max(1, page - 1),
                        }))
                      }
                      disabled={page <= 1 || isFetching}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="size-4" />
                      Anterior
                    </Button>
                    <span className="min-w-[7rem] px-2 text-center text-sm tabular-nums text-muted-foreground">
                      Página {page} de {Math.max(1, totalPages)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setParams((prev) => ({
                          ...prev,
                          page: Math.min(totalPages, page + 1),
                        }))
                      }
                      disabled={page >= totalPages || isFetching}
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

      {/* Dialog crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Nuevo proyecto</DialogTitle>
              <DialogDescription>
                Crea un proyecto para organizar cálculos y planos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nombre</Label>
                <Input
                  id="project-name"
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  required
                  placeholder="Ej: Residencia García"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-desc">Descripción</Label>
                <textarea
                  id="project-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción del proyecto..."
                  rows={3}
                  className="border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Crear proyecto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog eliminar */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar proyecto</DialogTitle>
            <DialogDescription>
              ¿Eliminar “{deleteTarget?.projectName}”? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
