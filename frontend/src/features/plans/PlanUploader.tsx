import { useState, useRef } from 'react';

interface PlanUploaderProps {
  onUploadComplete: (planId: string, filename: string) => void;
}

export default function PlanUploader({ onUploadComplete }: PlanUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'dxf') {
      setError('Solo se permiten archivos PDF o DXF');
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máximo 60MB)');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/plans/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Error al subir el archivo');
      }

      const data = await response.json();
      onUploadComplete(data.plan_id, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.dxf"
        onChange={handleFileInput}
        className="hidden"
      />

      {uploading ? (
        <div>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Subiendo archivo...</p>
        </div>
      ) : (
        <div>
          <div className="text-4xl mb-3">📐</div>
          <p className="text-lg font-medium text-gray-700">
            Arrastra un archivo PDF o DXF aquí
          </p>
          <p className="text-sm text-gray-500 mt-1">o haz click para seleccionar</p>
          <p className="text-xs text-gray-400 mt-2">Máximo 60MB</p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
      )}
    </div>
  );
}
