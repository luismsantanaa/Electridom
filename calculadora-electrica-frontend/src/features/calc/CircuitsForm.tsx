import { useState } from 'react';
import { useCircuitsCalc } from './useCalculations';
import type { DiversifiedLoad, DemandResponse, CircuitsResponse } from '@shared/types/calc.types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cargas = (demandResult?.cargas_diversificadas || []).map((c: DiversifiedLoad) => ({
      category: c.category,
      carga_diversificada_va: c.carga_diversificada_va,
      demand_factor: c.demand_factor,
    }));

    mutation.mutate(
      {
        cargas_diversificadas: cargas,
        system: { voltage_v: voltage, phases, system_type: phases },
      },
      { onSuccess: onComplete },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Cargas Diversificadas (desde CE-02)</h3>
        {demandResult?.cargas_diversificadas.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Categoría</th>
                <th className="text-right py-2">Original (VA)</th>
                <th className="text-right py-2">Factor</th>
                <th className="text-right py-2">Diversificada (VA)</th>
              </tr>
            </thead>
            <tbody>
              {demandResult.cargas_diversificadas.map((c, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2">{c.category}</td>
                  <td className="text-right py-2">{c.carga_original_va.toLocaleString()}</td>
                  <td className="text-right py-2">{(c.demand_factor * 100).toFixed(0)}%</td>
                  <td className="text-right py-2">{c.carga_diversificada_va.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm">
            Primero completa el cálculo de demanda (CE-02).
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Sistema Eléctrico</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voltaje (V)</label>
            <input
              type="number"
              value={voltage}
              onChange={(e) => setVoltage(+e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fases</label>
            <select
              value={phases}
              onChange={(e) => setPhases(+e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={1}>Monofásico</option>
              <option value={3}>Trifásico</option>
            </select>
          </div>
        </div>
      </div>

      {mutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error al calcular circuitos.
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || !demandResult}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
      >
        {mutation.isPending ? 'Calculando...' : 'Calcular Circuitos (CE-03)'}
      </button>
    </form>
  );
}
