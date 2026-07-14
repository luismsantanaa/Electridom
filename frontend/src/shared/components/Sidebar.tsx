import { NavLink } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { NAV_ITEMS } from './nav-items';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export default function Sidebar({ className, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border p-4">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Zap className="size-5 text-primary" />
        </div>
        <h2 className="truncate text-lg font-bold text-foreground">Calculadora RD</h2>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
