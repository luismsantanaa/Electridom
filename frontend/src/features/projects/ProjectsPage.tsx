import { useState } from 'react';
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
} from './useProjects';
import type { ProjectListParams, CreateProjectRequest } from '@shared/types/project.types';

export default function ProjectsPage() {
  const [params, setParams] = useState<ProjectListParams>({ page: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateProjectRequest>({
    projectName: '',
    description: '',
    surfaces: [],
    consumptions: [],
    computeNow: false,
  });

  const { data, isLoading, isError } = useProjects(params);
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ ...params, page: 1, q: search || undefined });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ projectName: '', description: '', surfaces: [], consumptions: [], computeNow: false });
      },
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar proyecto "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Proyecto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ej: Residencia García"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
              placeholder="Descripción del proyecto..."
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg"
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Proyecto'}
          </button>
        </form>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proyectos..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* List */}
      {isLoading && <p className="text-gray-500">Cargando proyectos...</p>}
      {isError && <p className="text-red-600">Error al cargar proyectos.</p>}
      {data && data.data.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No hay proyectos. Crea uno para comenzar.
        </div>
      )}
      {data && data.data.length > 0 && (
        <div className="space-y-3">
          {data.data.map((project) => (
            <div
              key={project.projectId}
              className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium text-gray-900">{project.projectName}</h3>
                <p className="text-sm text-gray-500">{project.description || 'Sin descripción'}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>Estado: {project.status}</span>
                  <span>Creado: {new Date(project.createdAt).toLocaleDateString()}</span>
                  {project.latestVersion && (
                    <span>v{project.latestVersion.versionNumber}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(project.projectId, project.projectName)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setParams({ ...params, page: Math.max(1, (params.page || 1) - 1) })}
            disabled={params.page === 1}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Página {params.page} de {data.totalPages}
          </span>
          <button
            onClick={() => setParams({ ...params, page: Math.min(data.totalPages, (params.page || 1) + 1) })}
            disabled={params.page === data.totalPages}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
