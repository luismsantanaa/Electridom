import { useState } from 'react';
import { useFeederCalc } from './useCalculations';
import type { CircuitsResponse, FeederResponse } from '@shared/types/calc.types';

interface FeederFormProps {
  circuitsResult: CircuitsResponse | null;
  voltage: number;
  phases: number;
  onComplete: (data: FeederResponse) => void;
}

export default function FeederForm({ circuitsResult, voltage, phases, onComplete }: FeederFormProps) {
  const [longitud, setLongitud] = useState(30);
  const [material, setMaterial] = useState('Cu');

  const mutation = useFeederCalc();

  const totalVA = circuitsResult?.totales.carga_total_va || 0;
  const totalA = circuitsResult?.totales.corriente_total_a || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        circuitos_ramales: (circuitsResult?.circuitos || []).map((c) => ({
          id_circuito: c.id_circuito,
          name: c.name,
          corriente_total_a: c.corriente_total_a,
          carga_total_va: c.carga_total_va,
          length_m: c.length_m,
        })),
        system: { voltage_v: voltage, phases, corriente_total_a: totalA, carga_total_va: totalVA },
        parameters: { longitud_alimentador_m: longitud, material_conductor: material },
      },
      { onSuccess: onComplete },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Circuitos Ramales (desde CE-03)</h3>
        {circuitsResult?.circuitos.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Nombre</th>
                <th className="text-right py-2">Corriente (A)</th>
                <th className="text-right py-2">Carga (VA)</th>
              </tr>
            </thead>
            <tbody>
              {circuitsResult.circuitos.map((c, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2">{c.id_circuito}</td>
                  <td className="py-2">{c.name}</td>
                  <td className="text-right py-2">{c.corriente_total_a.toFixed(2)}</td>
                  <td className="text-right py-2">{c.carga_total_va.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm">Primero completa el cálculo de circuitos (CE-03).</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Parámetros del Alimentador</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitud alimentador (m)
            </label>
            <input
              type="number"
              value={longitud}
              onChange={(e) => setLongitud(+e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Cu">Cobre (Cu)</option>
              <option value="Al">Aluminio (Al)</option>
            </select>
          </div>
        </div>
      </div>

      {mutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error al calcular alimentador.
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || !circuitsResult}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
      >
        {mutation.isPending ? 'Calculando...' : 'Calcular Alimentador (CE-04)'}
      </button>
    </form>
  );
}
