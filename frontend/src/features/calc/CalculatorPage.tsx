import { useState } from 'react';
import RoomsForm from './RoomsForm';
import DemandForm from './DemandForm';
import CircuitsForm from './CircuitsForm';
import FeederForm from './FeederForm';
import GroundingForm from './GroundingForm';
import ResultsView from './ResultsView';
import type {
  RoomsResponse,
  DemandResponse,
  CircuitsResponse,
  FeederResponse,
  GroundingResponse,
} from '@shared/types/calc.types';

const steps = [
  { key: 'rooms', label: 'CE-01 Habitaciones' },
  { key: 'demand', label: 'CE-02 Demanda' },
  { key: 'circuits', label: 'CE-03 Circuitos' },
  { key: 'feeder', label: 'CE-04 Alimentador' },
  { key: 'grounding', label: 'CE-05 Puesta a Tierra' },
  { key: 'results', label: 'Resultados' },
];

export default function CalculatorPage() {
  const [step, setStep] = useState(0);
  const [roomsResult, setRoomsResult] = useState<RoomsResponse | null>(null);
  const [demandResult, setDemandResult] = useState<DemandResponse | null>(null);
  const [circuitsResult, setCircuitsResult] = useState<CircuitsResponse | null>(null);
  const [feederResult, setFeederResult] = useState<FeederResponse | null>(null);
  const [groundingResult, setGroundingResult] = useState<GroundingResponse | null>(null);

  const voltage = roomsResult?.totales.voltage_v || 120;
  const phases = roomsResult?.totales.phases || 1;
  const totalVA = demandResult?.totales_diversificados.carga_total_diversificada_va || 0;
  const totalA = demandResult?.totales_diversificados.corriente_total_diversificada_a || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calculadora Eléctrica</h1>

      {/* Step tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {steps.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStep(i)}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              step === i
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && <RoomsForm onComplete={setRoomsResult} />}
      {step === 1 && <DemandForm roomsResult={roomsResult} onComplete={setDemandResult} />}
      {step === 2 && <CircuitsForm demandResult={demandResult} onComplete={setCircuitsResult} />}
      {step === 3 && (
        <FeederForm
          circuitsResult={circuitsResult}
          voltage={voltage}
          phases={phases}
          onComplete={setFeederResult}
        />
      )}
      {step === 4 && (
        <GroundingForm
          feederResult={feederResult}
          voltage={voltage}
          phases={phases}
          totalVA={totalVA}
          totalA={totalA}
          onComplete={setGroundingResult}
        />
      )}
      {step === 5 && (
        <ResultsView
          rooms={roomsResult}
          demand={demandResult}
          circuits={circuitsResult}
          feeder={feederResult}
          grounding={groundingResult}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
        >
          ← Anterior
        </button>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
