import { LayoutDashboard, Calculator, Ruler, FolderKanban, Zap } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calculator', label: 'Calculadora', icon: Calculator },
  { to: '/plans', label: 'Planos', icon: Ruler },
  { to: '/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/unifilar', label: 'Unifilar', icon: Zap },
] as const;
