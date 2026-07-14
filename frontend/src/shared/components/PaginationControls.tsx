import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  idPrefix?: string;
}

export function PaginationControls({
  page,
  pageSize,
  total,
  totalPages,
  from,
  to,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  idPrefix = 'pagination',
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? '0 resultados' : `Mostrando ${from}–${to} de ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={`${idPrefix}-page-size`}
            className="whitespace-nowrap text-muted-foreground"
          >
            Por página
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger id={`${idPrefix}-page-size`} className="w-[72px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || isFetching}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <span className="min-w-[7rem] px-2 text-center text-sm tabular-nums text-muted-foreground">
            Página {page} de {Math.max(1, totalPages)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isFetching}
            aria-label="Página siguiente"
          >
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
