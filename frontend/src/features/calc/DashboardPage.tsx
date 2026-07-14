import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Calculator, FileStack, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '@features/auth/useAuth';
import { useProjects } from '@features/projects/useProjects';
import { useQuery } from '@tanstack/react-query';
import { plansApi } from '@shared/api/plans.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  tooltip: string;
  icon: ReactNode;
  href: string;
  isLoading?: boolean;
}

function MetricCard({ title, value, tooltip, icon, href, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="gap-4">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to={href} className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      <Card
        className={cn(
          'gap-4 transition-all duration-200 motion-reduce:transition-none',
          'hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0',
          'group-focus-visible:ring-2 group-focus-visible:ring-ring',
        )}
      >
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <CardTitle className="text-sm font-medium text-muted-foreground truncate">
                {title}
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Info: ${title}`}
                    onClick={(e) => e.preventDefault()}
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">{icon}</div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, loadUser, isLoading: authLoading } = useAuth();
  const { data: projectsData, isLoading: projectsLoading } = useProjects({
    page: 1,
    pageSize: 100,
  });
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans', { page: 1, pageSize: 1 }],
    queryFn: () => plansApi.list({ page: 1, pageSize: 1 }),
  });

  useEffect(() => {
    if (!user) loadUser();
  }, [user, loadUser]);

  const metricsLoading = authLoading || projectsLoading || plansLoading;
  const activeProjects = projectsData?.total ?? 0;
  const processedPlans = plansData?.total ?? 0;
  // Proxy: proyectos con al menos una versión calculada (muestra cargada)
  const calculationsDone =
    projectsData?.data?.filter((p) => !!p.latestVersion).length ?? 0;

  return (
    <div className="space-y-8 motion-safe:animate-[fadeIn_200ms_ease-out]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumen de tu actividad en Calculadora Eléctrica RD
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        <MetricCard
          title="Proyectos activos"
          value={activeProjects}
          tooltip="Total de proyectos eléctricos creados en tu cuenta"
          icon={<FolderKanban className="size-5" />}
          href="/projects"
          isLoading={metricsLoading}
        />
        <MetricCard
          title="Cálculos realizados"
          value={calculationsDone}
          tooltip="Proyectos con al menos una versión de cálculo generada"
          icon={<Calculator className="size-5" />}
          href="/calculator"
          isLoading={metricsLoading}
        />
        <MetricCard
          title="Planos procesados"
          value={processedPlans}
          tooltip="Planos PDF/DXF subidos y procesados por el sistema"
          icon={<FileStack className="size-5" />}
          href="/plans"
          isLoading={metricsLoading}
        />
      </div>

      {metricsLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="flex gap-3">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
          </CardContent>
        </Card>
      ) : (
        <Card className="transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none">
          <CardHeader>
            <CardTitle className="text-lg">
              {user ? `Bienvenido, ${user.name}` : 'Bienvenido'}
            </CardTitle>
            <CardDescription>
              Comienza creando un nuevo proyecto o subiendo un plano para procesar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/projects">
                Nuevo proyecto
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/plans">Subir plano</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/calculator">Abrir calculadora</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
