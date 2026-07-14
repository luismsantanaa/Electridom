import { useState } from 'react';
import { useGroundingCalc } from './useCalculations';
import type { FeederResponse, GroundingResponse } from '@shared/types/calc.types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        system: { voltage_v: voltage, phases, corriente_total_a: totalA, carga_total_va: totalVA },
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Parámetros de Puesta a Tierra</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Breaker principal (A)
            </label>
            <input
              type="number"
              value={breakerAmp}
              onChange={(e) => setBreakerAmp(+e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo instalación
            </label>
            <select
              value={tipoInstalacion}
              onChange={(e) => setTipoInstalacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="residencial">Residencial</option>
              <option value="comercial">Comercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sistema de tierra
            </label>
            <select
              value={tipoSistema}
              onChange={(e) => setTipoSistema(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="TN-S">TN-S</option>
              <option value="TN-C-S">TN-C-S</option>
              <option value="TT">TT</option>
              <option value="IT">IT</option>
            </select>
          </div>
        </div>
      </div>

      {mutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error al calcular puesta a tierra.
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || !feederResult}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
      >
        {mutation.isPending ? 'Calculando...' : 'Calcular Puesta a Tierra (CE-05)'}
      </button>
    </form>
  );
}
