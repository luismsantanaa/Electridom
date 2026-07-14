import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import RoomsForm from './RoomsForm';
import DemandForm from './DemandForm';
import CircuitsForm from './CircuitsForm';
import FeederForm from './FeederForm';
import GroundingForm from './GroundingForm';
import ResultsView from './ResultsView';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  RoomsResponse,
  DemandResponse,
  CircuitsResponse,
  FeederResponse,
  GroundingResponse,
} from '@shared/types/calc.types';

const steps = [
  { key: 'rooms', label: 'Habitaciones', code: 'CE-01' },
  { key: 'demand', label: 'Demanda', code: 'CE-02' },
  { key: 'circuits', label: 'Circuitos', code: 'CE-03' },
  { key: 'feeder', label: 'Alimentador', code: 'CE-04' },
  { key: 'grounding', label: 'Puesta a Tierra', code: 'CE-05' },
  { key: 'results', label: 'Resultados', code: 'Fin' },
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

  const completed = [
    !!roomsResult,
    !!demandResult,
    !!circuitsResult,
    !!feederResult,
    !!groundingResult,
    !!(roomsResult || demandResult || circuitsResult || feederResult || groundingResult),
  ];

  const progressPct = ((step + 1) / steps.length) * 100;

  const goNext = () => setStep((s) => Math.min(steps.length - 1, s + 1));

  return (
    <div className="space-y-6 motion-safe:animate-[fadeIn_200ms_ease-out]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Calculadora Eléctrica
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Flujo NEC 2023 — paso {step + 1} de {steps.length}: {steps[step].label}
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label="Progreso del cálculo"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 motion-reduce:transition-none"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step tabs */}
      <nav
        className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1"
        aria-label="Pasos de la calculadora"
      >
        {steps.map((s, i) => {
          const isActive = step === i;
          const isDone = completed[i] && i < step;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                'flex min-w-0 shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  isActive && 'bg-primary text-primary-foreground',
                  isDone && !isActive && 'bg-primary/15 text-primary',
                  !isActive && !isDone && 'bg-muted-foreground/15 text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-3" aria-hidden /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.code}</span>
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Step content */}
      <div
        key={step}
        className="motion-safe:animate-[fadeIn_200ms_ease-out]"
      >
        {step === 0 && (
          <RoomsForm
            onComplete={(data) => {
              setRoomsResult(data);
              goNext();
            }}
          />
        )}
        {step === 1 && (
          <DemandForm
            roomsResult={roomsResult}
            onComplete={(data) => {
              setDemandResult(data);
              goNext();
            }}
          />
        )}
        {step === 2 && (
          <CircuitsForm
            demandResult={demandResult}
            onComplete={(data) => {
              setCircuitsResult(data);
              goNext();
            }}
          />
        )}
        {step === 3 && (
          <FeederForm
            circuitsResult={circuitsResult}
            voltage={voltage}
            phases={phases}
            onComplete={(data) => {
              setFeederResult(data);
              goNext();
            }}
          />
        )}
        {step === 4 && (
          <GroundingForm
            feederResult={feederResult}
            voltage={voltage}
            phases={phases}
            totalVA={totalVA}
            totalA={totalA}
            onComplete={(data) => {
              setGroundingResult(data);
              goNext();
            }}
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
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <Button
          type="button"
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
