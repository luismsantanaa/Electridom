import { useAuth } from '@features/auth/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500">
        Calculadora Eléctrica RD — NEC 2023
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          {user?.name} {user?.apellido}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
