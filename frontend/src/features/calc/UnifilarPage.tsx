import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import UnifilarAdvancedExport from './UnifilarAdvancedExport';

export default function UnifilarPage() {
  const [searchParams] = useSearchParams();
  const initialId = Number(searchParams.get('projectId')) || 0;
  const [projectId, setProjectId] = useState(initialId);
  const [inputValue, setInputValue] = useState(
    initialId > 0 ? String(initialId) : ''
  );
  const [active, setActive] = useState(initialId > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number(inputValue);
    if (id > 0) {
      setProjectId(id);
      setActive(true);
    }
  };

  return (
    <div className="space-y-6 motion-safe:animate-[fadeIn_200ms_ease-out]">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/calculator">
            <ArrowLeft className="mr-2 size-4" />
            Volver a Calculadora
          </Link>
        </Button>
      </div>

      {!active && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-center text-sm text-muted-foreground">
              Ingresa el ID del proyecto para generar el diagrama unifilar
              avanzado.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Project ID"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-40"
              />
              <Button type="submit" disabled={!inputValue || Number(inputValue) < 1}>
                <Search className="mr-2 size-4" />
                Generar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {active && <UnifilarAdvancedExport projectId={projectId} />}
    </div>
  );
}
