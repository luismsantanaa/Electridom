import { useState } from 'react';
import { useDemandCalc } from './useCalculations';
import type { CategoryLoad, RoomsResponse, DemandResponse } from '@shared/types/calc.types';

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

  const handleSubmit = (e: React.FormEvent) => {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Cargas por Categoría</h3>
          <button type="button" onClick={addCategory} className="text-sm text-blue-600 hover:text-blue-700">
            + Agregar
          </button>
        </div>
        {categories.map((c, i) => (
          <div key={i} className="flex gap-3 mb-2">
            <input
              type="text"
              placeholder="Categoría"
              value={c.category}
              onChange={(e) => updateCategory(i, 'category', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Carga (VA)"
              value={c.carga_va || ''}
              onChange={(e) => updateCategory(i, 'carga_va', +e.target.value)}
              className="w-36 px-3 py-2 border border-gray-300 rounded-lg"
            />
            {categories.length > 1 && (
              <button type="button" onClick={() => removeCategory(i)} className="text-red-500 px-2">
                ×
              </button>
            )}
          </div>
        ))}
        <div className="mt-3 text-sm text-gray-600">
          Total: <strong>{totalVA.toLocaleString()} VA</strong>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Sistema</h3>
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
          Error al calcular demanda.
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
      >
        {mutation.isPending ? 'Calculando...' : 'Calcular Demanda (CE-02)'}
      </button>
    </form>
  );
}
