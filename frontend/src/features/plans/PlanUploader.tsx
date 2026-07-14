import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { FileUp, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { plansApi } from '@shared/api/plans.api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface PlanUploaderProps {
  onUploadComplete: (planId: string, filename: string) => void;
}

export default function PlanUploader({ onUploadComplete }: PlanUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'dxf') {
      setError('Solo se permiten archivos PDF o DXF');
      toast.error('Formato no válido. Usa PDF o DXF.');
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máximo 60MB)');
      toast.error('Archivo demasiado grande (máx. 60MB)');
      return;
    }

    setError(null);
    setFileName(file.name);
    setUploading(true);
    setProgress(0);

    try {
      const data = await plansApi.upload(file, undefined, setProgress);
      toast.success('Archivo subido. Procesando plano…');
      onUploadComplete(data.plan_id, file.name);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { detail?: string; message?: string } } }).response
              ?.data?.detail ||
              (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
              'Error al subir el archivo')
          : err instanceof Error
            ? err.message
            : 'Error al subir el archivo';
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de planos PDF o DXF"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          'rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          uploading ? 'cursor-wait' : 'cursor-pointer',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/40',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.dxf"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="mx-auto max-w-sm space-y-3">
            <Loader2 className="mx-auto size-10 animate-spin text-primary" />
            <p className="font-medium text-foreground">Subiendo archivo…</p>
            {fileName && (
              <p className="truncate text-sm text-muted-foreground">{fileName}</p>
            )}
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de subida"
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs tabular-nums text-muted-foreground">{progress}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
              {dragging ? (
                <Upload className="size-6 text-primary" />
              ) : (
                <FileUp className="size-6 text-primary" />
              )}
            </div>
            <p className="text-lg font-medium text-foreground">
              {dragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo PDF o DXF'}
            </p>
            <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
            <p className="text-xs text-muted-foreground">Máximo 60MB · PDF / DXF</p>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
