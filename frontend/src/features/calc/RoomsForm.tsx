import { useState, type FormEvent } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useRoomsCalc } from './useCalculations';
import type { Surface, Consumption, RoomsResponse } from '@shared/types/calc.types';
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

interface RoomsFormProps {
  onComplete: (data: RoomsResponse) => void;
}

export default function RoomsForm({ onComplete }: RoomsFormProps) {
  const [surfaces, setSurfaces] = useState<Surface[]>([{ name: '', area_m2: 0 }]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([
    { name: '', environment: '', power_w: 0 },
  ]);
  const [voltage, setVoltage] = useState(120);
  const [phases, setPhases] = useState(1);

  const mutation = useRoomsCalc();

  const addSurface = () => setSurfaces([...surfaces, { name: '', area_m2: 0 }]);
  const removeSurface = (i: number) => setSurfaces(surfaces.filter((_, idx) => idx !== i));
  const updateSurface = (i: number, field: keyof Surface, value: string | number) =>
    setSurfaces(surfaces.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  const addConsumption = () =>
    setConsumptions([...consumptions, { name: '', environment: '', power_w: 0 }]);
  const removeConsumption = (i: number) =>
    setConsumptions(consumptions.filter((_, idx) => idx !== i));
  const updateConsumption = (i: number, field: keyof Consumption, value: string | number) =>
    setConsumptions(consumptions.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        system: { voltage, phases },
        surfaces: surfaces.filter((s) => s.name),
        consumptions: consumptions.filter((c) => c.name && c.environment),
      },
      { onSuccess: onComplete },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rooms-voltage">Voltaje (V)</Label>
              <Input
                id="rooms-voltage"
                type="number"
                value={voltage}
                onChange={(e) => setVoltage(+e.target.value)}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rooms-phases">Fases</Label>
              <Select
                value={String(phases)}
                onValueChange={(v) => setPhases(Number(v))}
              >
                <SelectTrigger id="rooms-phases" className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monofásico (1)</SelectItem>
                  <SelectItem value="3">Trifásico (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Ambientes / Superficies</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={addSurface}>
            <Plus className="size-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {surfaces.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="text"
                placeholder="Nombre"
                value={s.name}
                onChange={(e) => updateSurface(i, 'name', e.target.value)}
                className="flex-1"
                aria-label={`Nombre ambiente ${i + 1}`}
              />
              <Input
                type="number"
                placeholder="Área (m²)"
                value={s.area_m2 || ''}
                onChange={(e) => updateSurface(i, 'area_m2', +e.target.value)}
                className="sm:w-32"
                min={0}
                aria-label={`Área ambiente ${i + 1}`}
              />
              {surfaces.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSurface(i)}
                  aria-label={`Eliminar ambiente ${i + 1}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Consumos</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={addConsumption}>
            <Plus className="size-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {consumptions.map((c, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="text"
                placeholder="Nombre"
                value={c.name}
                onChange={(e) => updateConsumption(i, 'name', e.target.value)}
                className="flex-1"
                aria-label={`Nombre consumo ${i + 1}`}
              />
              <Input
                type="text"
                placeholder="Ambiente"
                value={c.environment}
                onChange={(e) => updateConsumption(i, 'environment', e.target.value)}
                className="flex-1"
                aria-label={`Ambiente consumo ${i + 1}`}
              />
              <Input
                type="number"
                placeholder="Watts"
                value={c.power_w || ''}
                onChange={(e) => updateConsumption(i, 'power_w', +e.target.value)}
                className="sm:w-28"
                min={0}
                aria-label={`Watts consumo ${i + 1}`}
              />
              {consumptions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeConsumption(i)}
                  aria-label={`Eliminar consumo ${i + 1}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {mutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Error al calcular. Verifica los datos e intenta de nuevo.
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? 'Calculando...' : 'Calcular Habitaciones (CE-01)'}
      </Button>
    </form>
  );
}
