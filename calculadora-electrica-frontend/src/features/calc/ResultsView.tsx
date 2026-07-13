import type {
  RoomsResponse,
  DemandResponse,
  CircuitsResponse,
  FeederResponse,
  GroundingResponse,
} from '@shared/types/calc.types';

interface ResultsViewProps {
  rooms: RoomsResponse | null;
  demand: DemandResponse | null;
  circuits: CircuitsResponse | null;
  feeder: FeederResponse | null;
  grounding: GroundingResponse | null;
}

export default function ResultsView({ rooms, demand, circuits, feeder, grounding }: ResultsViewProps) {
  return (
    <div className="space-y-6">
      {rooms && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-3">CE-01: Habitaciones</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Carga total</div>
              <div className="text-lg font-bold">{rooms.totales.carga_total_va.toLocaleString()} VA</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Diversificada</div>
              <div className="text-lg font-bold">{rooms.totales.carga_diversificada_va.toLocaleString()} VA</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Corriente</div>
              <div className="text-lg font-bold">{rooms.totales.corriente_total_a.toFixed(2)} A</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Ambientes</div>
              <div className="text-lg font-bold">{rooms.environments.length}</div>
            </div>
          </div>
        </div>
      )}

      {demand && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-3">CE-02: Demanda</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Original</div>
              <div className="text-lg font-bold">{demand.totales_diversificados.carga_total_original_va.toLocaleString()} VA</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Diversificada</div>
              <div className="text-lg font-bold">{demand.totales_diversificados.carga_total_diversificada_va.toLocaleString()} VA</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Factor</div>
              <div className="text-lg font-bold">{(demand.totales_diversificados.factor_diversificacion_efectivo * 100).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Ahorro</div>
              <div className="text-lg font-bold">{demand.totales_diversificados.porcentaje_ahorro.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {circuits && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-3">CE-03: Circuitos</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Total circuitos</div>
              <div className="text-lg font-bold">{circuits.totales.total_circuitos}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Carga total</div>
              <div className="text-lg font-bold">{circuits.totales.carga_total_va.toLocaleString()} VA</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Corriente total</div>
              <div className="text-lg font-bold">{circuits.totales.corriente_total_a.toFixed(2)} A</div>
            </div>
          </div>
        </div>
      )}

      {feeder && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-3">CE-04: Alimentador</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Calibre</div>
              <div className="text-lg font-bold">{feeder.alimentador.calibre_awg} AWG</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Sección</div>
              <div className="text-lg font-bold">{feeder.alimentador.section_mm2} mm²</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Ampacidad</div>
              <div className="text-lg font-bold">{feeder.alimentador.ampacidad_a} A</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Caída tensión</div>
              <div className="text-lg font-bold">{feeder.alimentador.caida_tension_pct.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}

      {grounding && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-3">CE-05: Puesta a Tierra</h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Electrodo</h4>
              <div className="space-y-1">
                <div>Tipo: <strong>{grounding.electrodo.tipo}</strong></div>
                <div>Cantidad: <strong>{grounding.electrodo.cantidad}</strong></div>
                <div>Profundidad: <strong>{grounding.electrodo.profundidad_m} m</strong></div>
                <div>Resistencia: <strong>{grounding.electrodo.resistencia_ohm} Ω</strong></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Conductor</h4>
              <div className="space-y-1">
                <div>Sección: <strong>{grounding.conductor.section_mm2} mm²</strong></div>
                <div>Calibre: <strong>{grounding.conductor.calibre_awg} AWG</strong></div>
                <div>Material: <strong>{grounding.conductor.material}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!rooms && !demand && !circuits && !feeder && !grounding && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
          Completa los cálculos para ver los resultados aquí.
        </div>
      )}
    </div>
  );
}
