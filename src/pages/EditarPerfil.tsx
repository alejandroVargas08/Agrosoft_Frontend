import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { usePerfil } from '../hooks/usePerfil';
import DashboardLayout from '../componets/layout/DashboardLayout';

function inicial(nombre?: string) {
  return nombre?.trim()?.charAt(0)?.toUpperCase() ?? '?';
}

export default function EditarPerfil() {
  const navigate = useNavigate();
  const { perfil, cargando, actualizarPerfil } = usePerfil();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre || '');
      setApellido(perfil.apellido || '');
      setTelefono(perfil.telefono || '');
    }
  }, [perfil]);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await actualizarPerfil({ nombre, apellido, telefono });
      navigate('/perfil');
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'No se pudo guardar los cambios. Intenta de nuevo.'
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <DashboardLayout unreadNotifications={2}>
        <div className="p-4 sm:p-8">
          <div className="animate-pulse space-y-4 max-w-xl">
            <div className="h-8 w-40 bg-gray-200 rounded" />
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout unreadNotifications={2}>
      <div className="p-4 sm:p-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/perfil')}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Volver"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Editar Perfil</h1>
          </div>

          <form
            onSubmit={handleGuardar}
            className="rounded-xl shadow-sm p-6 sm:p-8 flex flex-col items-center"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div className="w-24 h-24 rounded-full bg-green-50 text-green-700 flex items-center justify-center text-4xl font-bold mb-4">
              {inicial(nombre)}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 mb-8"
            >
              <Camera size={16} />
              Cambiar foto
            </button>

            <div className="w-full mb-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Nombre 
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

            <div className="w-full mb-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Apellido 
              </label>
              <input
                type="text"
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

            <div className="w-full mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

            {error && (
              <div className="w-full mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}