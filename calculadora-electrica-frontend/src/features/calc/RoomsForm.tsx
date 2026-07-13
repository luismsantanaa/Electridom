import { useState } from 'react';
import { useRoomsCalc } from './useCalculations';
import type { Surface, Consumption, RoomsResponse } from '@shared/types/calc.types';

interface RoomsFormProps {
  onComplete: (data: RoomsResponse) => void;
}

export default function RoomsForm({ onComplete }: RoomsFormProps) {
  const [surfaces, setSurfaces] = useState<Surface[]>([
    { name: '', area_m2: 0 },
  ]);
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

  const handleSubmit = (e: React.FormEvent) => {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración del Sistema</h3>
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
              <option value={1}>Monofásico (1)</option>
              <option value={3}>Trifásico (3)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Ambientes / Superficies</h3>
          <button type="button" onClick={addSurface} className="text-sm text-blue-600 hover:text-blue-700">
            + Agregar
          </button>
        </div>
        {surfaces.map((s, i) => (
          <div key={i} className="flex gap-3 mb-2">
            <input
              type="text"
              placeholder="Nombre"
              value={s.name}
              onChange={(e) => updateSurface(i, 'name', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Área (m²)"
              value={s.area_m2 || ''}
              onChange={(e) => updateSurface(i, 'area_m2', +e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
            />
            {surfaces.length > 1 && (
              <button type="button" onClick={() => removeSurface(i)} className="text-red-500 px-2">
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Consumos</h3>
          <button type="button" onClick={addConsumption} className="text-sm text-blue-600 hover:text-blue-700">
            + Agregar
          </button>
        </div>
        {consumptions.map((c, i) => (
          <div key={i} className="flex gap-3 mb-2">
            <input
              type="text"
              placeholder="Nombre"
              value={c.name}
              onChange={(e) => updateConsumption(i, 'name', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Ambiente"
              value={c.environment}
              onChange={(e) => updateConsumption(i, 'environment', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Watts"
              value={c.power_w || ''}
              onChange={(e) => updateConsumption(i, 'power_w', +e.target.value)}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg"
            />
            {consumptions.length > 1 && (
              <button type="button" onClick={() => removeConsumption(i)} className="text-red-500 px-2">
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {mutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error al calcular. Verifica los datos e intenta de nuevo.
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
      >
        {mutation.isPending ? 'Calculando...' : 'Calcular Habitaciones (CE-01)'}
      </button>
    </form>
  );
}
