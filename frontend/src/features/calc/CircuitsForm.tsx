import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useCircuitsCalc } from './useCalculations';
import type { DiversifiedLoad, DemandResponse, CircuitsResponse } from '@shared/types/calc.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationControls } from '@/shared/components/PaginationControls';
import { useClientPagination } from '@/shared/hooks/useClientPagination';

interface CircuitsFormProps {
  demandResult: DemandResponse | null;
  onComplete: (data: CircuitsResponse) => void;
}

export default function CircuitsForm({ demandResult, onComplete }: CircuitsFormProps) {
  const [voltage, setVoltage] = useState(
    demandResult?.totales_diversificados.voltage_v || 120,
  );
  const [phases, setPhases] = useState(demandResult?.totales_diversificados.phases || 1);

  const mutation = useCircuitsCalc();
  const cargas = demandResult?.cargas_diversificadas ?? [];
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
  } = useClientPagination(cargas, 10);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = cargas.map((c: DiversifiedLoad) => ({
      category: c.category,
      carga_diversificada_va: c.carga_diversificada_va,
      demand_factor: c.demand_factor,
    }));

    mutation.mutate(
      {
        cargas_diversificadas: payload,
        system: { voltage_v: voltage, phases, system_type: phases },
      },
      { onSuccess: onComplete },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cargas Diversificadas (desde CE-02)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cargas.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2 text-left font-medium">Categoría</th>
                      <th className="py-2 text-right font-medium">Original (VA)</th>
                      <th className="py-2 text-right font-medium">Factor</th>
                      <th className="py-2 text-right font-medium">Diversificada (VA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((c, i) => (
                      <tr key={`${c.category}-${i}`} className="border-b border-border/60">
                        <td className="py-2 text-foreground">{c.category}</td>
                        <td className="py-2 text-right tabular-nums">
                          {c.carga_original_va.toLocaleString()}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {(c.demand_factor * 100).toFixed(0)}%
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium">
                          {c.carga_diversificada_va.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                idPrefix="circuits-cargas"
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                from={from}
                to={to}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Primero completa el cálculo de demanda (CE-02).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sistema Eléctrico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="circuits-voltage">Voltaje (V)</Label>
              <Input
                id="circuits-voltage"
                type="number"
                value={voltage}
                onChange={(e) => setVoltage(+e.target.value)}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="circuits-phases">Fases</Label>
              <Select value={String(phases)} onValueChange={(v) => setPhases(Number(v))}>
                <SelectTrigger id="circuits-phases" className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monofásico</SelectItem>
                  <SelectItem value="3">Trifásico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {mutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>Error al calcular circuitos.</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending || !demandResult}
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? 'Calculando...' : 'Calcular Circuitos (CE-03)'}
      </Button>
    </form>
  );
}
