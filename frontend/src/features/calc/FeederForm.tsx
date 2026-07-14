import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeederCalc } from './useCalculations';
import type { CircuitsResponse, FeederResponse } from '@shared/types/calc.types';
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

interface FeederFormProps {
  circuitsResult: CircuitsResponse | null;
  voltage: number;
  phases: number;
  onComplete: (data: FeederResponse) => void;
}

export default function FeederForm({
  circuitsResult,
  voltage,
  phases,
  onComplete,
}: FeederFormProps) {
  const [longitud, setLongitud] = useState(30);
  const [material, setMaterial] = useState('Cu');

  const mutation = useFeederCalc();

  const circuitos = circuitsResult?.circuitos ?? [];
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
  } = useClientPagination(circuitos, 10);

  const totalVA = circuitsResult?.totales.carga_total_va || 0;
  const totalA = circuitsResult?.totales.corriente_total_a || 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        circuitos_ramales: circuitos.map((c) => ({
          id_circuito: c.id_circuito,
          name: c.name,
          corriente_total_a: c.corriente_total_a,
          carga_total_va: c.carga_total_va,
          length_m: c.length_m,
        })),
        system: {
          voltage_v: voltage,
          phases,
          corriente_total_a: totalA,
          carga_total_va: totalVA,
        },
        parameters: { longitud_alimentador_m: longitud, material_conductor: material },
      },
      { onSuccess: onComplete },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Circuitos Ramales (desde CE-03)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {circuitos.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2 text-left font-medium">ID</th>
                      <th className="py-2 text-left font-medium">Nombre</th>
                      <th className="py-2 text-right font-medium">Corriente (A)</th>
                      <th className="py-2 text-right font-medium">Carga (VA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((c, i) => (
                      <tr key={`${c.id_circuito}-${i}`} className="border-b border-border/60">
                        <td className="py-2 tabular-nums">{c.id_circuito}</td>
                        <td className="py-2">{c.name}</td>
                        <td className="py-2 text-right tabular-nums">
                          {c.corriente_total_a.toFixed(2)}
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium">
                          {c.carga_total_va.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                idPrefix="feeder-circuitos"
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
              Primero completa el cálculo de circuitos (CE-03).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros del Alimentador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="feeder-length">Longitud alimentador (m)</Label>
              <Input
                id="feeder-length"
                type="number"
                value={longitud}
                onChange={(e) => setLongitud(+e.target.value)}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeder-material">Material</Label>
              <Select value={material} onValueChange={setMaterial}>
                <SelectTrigger id="feeder-material" className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cu">Cobre (Cu)</SelectItem>
                  <SelectItem value="Al">Aluminio (Al)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {mutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>Error al calcular alimentador.</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending || !circuitsResult}
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? 'Calculando...' : 'Calcular Alimentador (CE-04)'}
      </Button>
    </form>
  );
}
