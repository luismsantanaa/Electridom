import { useState, useEffect, useCallback } from 'react';
import PlanUploader from './PlanUploader';
import PlanViewer from './PlanViewer';
import SpaceEditor from './SpaceEditor';
import SpaceGraphics from './SpaceGraphics';
import { plansApi } from '@shared/api/plans.api';
import type { DetectedSpace } from '@shared/types/plan.types';

type Phase = 'upload' | 'processing' | 'review';

export default function PlansPage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [planId, setPlanId] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [spaces, setSpaces] = useState<DetectedSpace[]>([]);
  const [viewMode, setViewMode] = useState<'viewer' | 'graphics'>('viewer');
  const [graphicsMode, setGraphicsMode] = useState<'treemap' | 'bubble'>('treemap');

  // Polling for processing status
  useEffect(() => {
    if (!planId || phase !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const status = await plansApi.getStatus(planId);
        if (status.processing_status === 'completed') {
          const result = await plansApi.getResult(planId);
          setSpaces(result.spaces);
          setPhase('review');
          clearInterval(interval);
        } else if (status.processing_status === 'failed') {
          alert('Error al procesar el plano: ' + (status.error_message || 'Desconocido'));
          setPhase('upload');
          setPlanId(null);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [planId, phase]);

  const handleUploadComplete = useCallback((id: string, name: string) => {
    setPlanId(id);
    setFilename(name);
    setPhase('processing');
  }, []);

  const handleSpacesChange = useCallback((updatedSpaces: DetectedSpace[]) => {
    setSpaces(updatedSpaces);
  }, []);

  const handleReset = useCallback(() => {
    setPhase('upload');
    setPlanId(null);
    setFilename('');
    setSpaces([]);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        {phase !== 'upload' && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
          >
            ← Subir otro plano
          </button>
        )}
      </div>

      {/* Upload Phase */}
      {phase === 'upload' && (
        <div className="max-w-2xl mx-auto">
          <PlanUploader onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Processing Phase */}
      {phase === 'processing' && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900">Procesando plano...</h2>
          <p className="text-gray-500 mt-2">{filename}</p>
          <p className="text-sm text-gray-400 mt-1">
            Detectando espacios automáticamente. Esto puede tardar unos segundos.
          </p>
        </div>
      )}

      {/* Review Phase */}
      {phase === 'review' && (
        <div>
          {/* View toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode('viewer')}
              className={`px-3 py-1 text-sm rounded-lg ${
                viewMode === 'viewer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Visor 2D
            </button>
            <button
              onClick={() => setViewMode('graphics')}
              className={`px-3 py-1 text-sm rounded-lg ${
                viewMode === 'graphics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Gráfica
            </button>
            {viewMode === 'graphics' && (
              <>
                <button
                  onClick={() => setGraphicsMode('treemap')}
                  className={`px-3 py-1 text-sm rounded-lg ml-4 ${
                    graphicsMode === 'treemap'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Treemap
                </button>
                <button
                  onClick={() => setGraphicsMode('bubble')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    graphicsMode === 'bubble'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Burbujas
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main view */}
            <div className="lg:col-span-2">
              {viewMode === 'viewer' ? (
                <PlanViewer spaces={spaces} mode="view" />
              ) : (
                <SpaceGraphics
                  spaces={spaces}
                  viewMode={graphicsMode}
                />
              )}
            </div>

            {/* Editor panel */}
            <div className="lg:col-span-1">
              {planId && (
                <SpaceEditor
                  planId={planId}
                  spaces={spaces}
                  onSpacesChange={handleSpacesChange}
                />
              )}

              {/* Statistics */}
              {spaces.length > 0 && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Estadísticas</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">Total espacios</div>
                      <div className="font-bold">{spaces.length}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Área total</div>
                      <div className="font-bold">
                        {spaces.reduce((sum, s) => sum + s.area_m2, 0).toFixed(1)} m²
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Verificados</div>
                      <div className="font-bold">
                        {spaces.filter((s) => s.is_verified).length}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Confianza prom.</div>
                      <div className="font-bold">
                        {(
                          (spaces.reduce((sum, s) => sum + s.confidence, 0) / spaces.length) *
                          100
                        ).toFixed(0)}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
