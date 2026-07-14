import { useEffect } from 'react';
import { useAuth } from '@features/auth/useAuth';

export default function DashboardPage() {
  const { user, loadUser } = useAuth();

  useEffect(() => {
    if (!user) loadUser();
  }, [user, loadUser]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Proyectos activos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Cálculos realizados</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Planos procesados</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
      </div>
      {user && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Bienvenido, {user.name}</h3>
          <p className="text-gray-500">
            Comienza creando un nuevo proyecto o subiendo un plano para procesar.
          </p>
        </div>
      )}
    </div>
  );
}
