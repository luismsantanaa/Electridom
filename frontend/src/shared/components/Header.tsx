import { useState } from 'react';
import { useAuth } from '@features/auth/useAuth';
import { useNavigate, NavLink } from 'react-router-dom';
import { LogOut, Menu, Zap } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NAV_ITEMS } from './nav-items';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b border-border bg-card px-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menú de navegación"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <div className="truncate text-sm text-muted-foreground">
          <span className="md:hidden">NEC 2023</span>
          <span className="hidden md:inline">Calculadora Eléctrica RD — NEC 2023</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {user && (
          <span className="hidden text-sm text-foreground sm:inline">
            {user.name} {user.apellido}
          </span>
        )}
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Cerrar sesión"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </Button>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="top-0 left-0 h-dvh max-h-dvh w-[min(100%,20rem)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 sm:max-w-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/10 p-1.5">
                <Zap className="size-4 text-primary" />
              </span>
              Calculadora RD
            </DialogTitle>
          </DialogHeader>
          <nav className="mt-2 space-y-1" aria-label="Navegación móvil">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
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
        </DialogContent>
      </Dialog>
    </header>
  );
}
