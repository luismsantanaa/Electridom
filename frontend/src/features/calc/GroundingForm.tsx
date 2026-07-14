import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useGroundingCalc } from './useCalculations';
import type { FeederResponse, GroundingResponse } from '@shared/types/calc.types';
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

interface GroundingFormProps {
  feederResult: FeederResponse | null;
  voltage: number;
  phases: number;
  totalVA: number;
  totalA: number;
  onComplete: (data: GroundingResponse) => void;
}

export default function GroundingForm({
  feederResult,
  voltage,
  phases,
  totalVA,
  totalA,
  onComplete,
}: GroundingFormProps) {
  const [breakerAmp, setBreakerAmp] = useState(100);
  const [tipoInstalacion, setTipoInstalacion] = useState('residencial');
  const [tipoSistema, setTipoSistema] = useState('TN-S');

  const mutation = useGroundingCalc();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        system: {
          voltage_v: voltage,
          phases,
          corriente_total_a: totalA,
          carga_total_va: totalVA,
        },
        feeder: {
          current_a: totalA,
          section_mm2: feederResult?.alimentador.section_mm2 || 0,
          material: feederResult?.alimentador.material || 'Cu',
          length_m: 0,
        },
        parameters: {
          main_breaker_amp: breakerAmp,
          tipo_instalacion: tipoInstalacion,
          tipo_sistema_tierra: tipoSistema,
        },
      },
      { onSuccess: onComplete },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros de Puesta a Tierra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ground-breaker">Breaker principal (A)</Label>
              <Input
                id="ground-breaker"
                type="number"
                value={breakerAmp}
                onChange={(e) => setBreakerAmp(+e.target.value)}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ground-install">Tipo instalación</Label>
              <Select value={tipoInstalacion} onValueChange={setTipoInstalacion}>
                <SelectTrigger id="ground-install" className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residencial">Residencial</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ground-system">Sistema de tierra</Label>
              <Select value={tipoSistema} onValueChange={setTipoSistema}>
                <SelectTrigger id="ground-system" className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TN-S">TN-S</SelectItem>
                  <SelectItem value="TN-C-S">TN-C-S</SelectItem>
                  <SelectItem value="TT">TT</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {mutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>Error al calcular puesta a tierra.</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={mutation.isPending || !feederResult}
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {mutation.isPending ? 'Calculando...' : 'Calcular Puesta a Tierra (CE-05)'}
      </Button>
    </form>
  );
}
