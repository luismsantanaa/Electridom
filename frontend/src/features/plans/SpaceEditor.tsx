import { useState, useCallback } from 'react';
import type { DetectedSpace } from '@shared/types/plan.types';
import { SPACE_TYPE_LABELS } from '@shared/types/plan.types';
import { plansApi } from '@shared/api/plans.api';

interface SpaceEditorProps {
  planId: string;
  spaces: DetectedSpace[];
  onSpacesChange: (spaces: DetectedSpace[]) => void;
}

export default function SpaceEditor({ planId, spaces, onSpacesChange }: SpaceEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleVerify = useCallback(
    async (spaceId: string) => {
      try {
        const updated = await plansApi.updateSpace(planId, spaceId, { is_verified: true });
        onSpacesChange(spaces.map((s) => (s.id === spaceId ? updated : s)));
      } catch (err) {
        console.error('Error verifying space:', err);
      }
    },
    [planId, spaces, onSpacesChange],
  );

  const handleNameSave = useCallback(
    async (spaceId: string) => {
      try {
        const updated = await plansApi.updateSpace(planId, spaceId, { name: editName });
        onSpacesChange(spaces.map((s) => (s.id === spaceId ? updated : s)));
        setEditingId(null);
      } catch (err) {
        console.error('Error updating space name:', err);
      }
    },
    [planId, spaces, editName, onSpacesChange],
  );

  const handleDelete = useCallback(
    async (spaceId: string) => {
      if (!confirm('¿Eliminar este espacio?')) return;
      try {
        // Mark as deleted by setting area to 0
        await plansApi.updateSpace(planId, spaceId, { vertices: [] });
        onSpacesChange(spaces.filter((s) => s.id !== spaceId));
      } catch (err) {
        console.error('Error deleting space:', err);
      }
    },
    [planId, spaces, onSpacesChange],
  );

  const verifiedCount = spaces.filter((s) => s.is_verified).length;
  const avgConfidence =
    spaces.length > 0
      ? spaces.reduce((sum, s) => sum + s.confidence, 0) / spaces.length
      : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Espacios detectados ({spaces.length})
        </h3>
        <div className="text-sm text-gray-500">
          Verificados: {verifiedCount}/{spaces.length} | Confianza promedio:{' '}
          {(avgConfidence * 100).toFixed(0)}%
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {spaces.map((space) => (
          <div
            key={space.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              space.is_verified
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex-1">
              {editingId === space.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => handleNameSave(space.id)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setEditingId(space.id);
                    setEditName(space.name);
                  }}
                >
                  <span className="font-medium text-sm">
                    {SPACE_TYPE_LABELS[space.space_type || 'unknown'] || space.name}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {space.area_m2.toFixed(1)} m²
                  </span>
                  {space.is_verified && (
                    <span className="ml-2 text-xs text-green-600">✓ Verificado</span>
                  )}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                Confianza: {(space.confidence * 100).toFixed(0)}% |{' '}
                {space.classification_method}
              </div>
            </div>

            <div className="flex gap-2 ml-3">
              {!space.is_verified && (
                <button
                  onClick={() => handleVerify(space.id)}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Verificar
                </button>
              )}
              <button
                onClick={() => handleDelete(space.id)}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {spaces.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          No hay espacios detectados. Sube un plano para comenzar.
        </p>
      )}
    </div>
  );
}
