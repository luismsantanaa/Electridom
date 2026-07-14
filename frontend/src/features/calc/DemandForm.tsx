import { useState, type FormEvent } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useDemandCalc } from './useCalculations';
import type { CategoryLoad, RoomsResponse, DemandResponse } from '@shared/types/calc.types';
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

interface DemandFormProps {
  roomsResult: RoomsResponse | null;
  onComplete: (data: DemandResponse) => void;
}

export default function DemandForm({ roomsResult, onComplete }: DemandFormProps) {
  const [categories, setCategories] = useState<CategoryLoad[]>(
    roomsResult?.environments.map((e) => ({
      category: e.name,
      carga_va: e.carga_va,
    })) || [{ category: '', carga_va: 0 }],
  );
  const [voltage, setVoltage] = useState(roomsResult?.totales.voltage_v || 120);
  const [phases, setPhases] = useState(roomsResult?.totales.phases || 1);

  const mutation = useDemandCalc();

  const addCategory = () => setCategories([...categories, { category: '', carga_va: 0 }]);
  const removeCategory = (i: number) =>
    setCategories(categories.filter((_, idx) => idx !== i));
  const updateCategory = (i: number, field: keyof CategoryLoad, value: string | number) =>
    setCategories(categories.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const totalVA = categories.reduce((sum, c) => sum + c.carga_va, 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        cargas_por_categoria: categories.filter((c) => c.category),
        totales: { carga_total_va: totalVA, voltage_v: voltage, phases },
      },
      { onSuccess: onComplete },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Cargas por Categoría</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={addCategory}>
            <Plus className="size-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.map((c, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="text"
                placeholder="Categoría"
                value={c.category}
                onChange={(e) => updateCategory(i, 'category', e.target.value)}
                className="flex-1"
                aria-label={`Categoría ${i + 1}`}
              />
              <Input
                type="number"
                placeholder="Carga (VA)"
                value={c.carga_va || ''}
                onChange={(e) => updateCategory(i, 'carga_va', +e.target.value)}
                className="sm:w-36"
                min={0}
                aria-label={`Carga VA ${i + 1}`}
              />
              {categories.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCategory(i)}
                  aria-label={`Eliminar categoría ${i + 1}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
          <p className="pt-2 text-sm text-muted-foreground">
            Total:{' '}
            <strong className="tabular-nums text-foreground">
              {totalVA.toLocaleString()} VA
            </strong>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demand-voltage">Voltaje (V)</Label>
              <Input
                id="demand-voltage"
                type="number"
                value={voltage}
                onChange={(e) => setVoltage(+e.target.value)}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demand-phases">Fases</Label>
              <Select value={String(phases)} onValueChange={(v) => setPhases(Number(v))}>
                <SelectTrigger id="demand-phases" className="w-full">
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
          <AlertDescription>Error al calcular demanda.</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? 'Calculando...' : 'Calcular Demanda (CE-02)'}
      </Button>
    </form>
  );
}
