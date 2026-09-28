import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { usePerfil } from '../hooks/usePerfil';
import { InicioUsuario } from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';

function inicial(nombre?: string) {
  const caracter = nombre?.trim()?.charAt(0)?.toUpperCase();
  return caracter || '?';
}

// Separa un nombre completo si el apellido viene vacío
function separarNombreCompleto(nombreCompleto: string, apellidoExistente?: string) {
  if (apellidoExistente && apellidoExistente.trim().length > 0) {
    return {
      nombre: nombreCompleto.trim(),
      apellido: apellidoExistente.trim(),
    };
  }

  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length <= 1) {
    return { nombre: partes[0] || '', apellido: '' };
  }
  if (partes.length === 2) {
    return { nombre: partes[0], apellido: partes[1] };
  }
  // Si tiene 3 o más palabras (ej: "Manuel Vargas Noriega" -> Nombre: "Manuel", Apellido: "Vargas Noriega")
  return {
    nombre: partes.slice(0, -2).join(' ') || partes[0],
    apellido: partes.slice(-2).join(' '),
  };
}

export default function EditarPerfil() {
  const navigate = useNavigate();
  const { user } = InicioUsuario();
  const { perfil, cargando, actualizarPerfil } = usePerfil();

  const sesionNombre = user?.nombre || user?.nombres || user?.name || '';
  const letraSesion = inicial(sesionNombre);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fuente = perfil?.nombre ? perfil.nombre : sesionNombre;
    const apellidoFuente = perfil?.apellido || '';

    const { nombre: n, apellido: a } = separarNombreCompleto(fuente, apellidoFuente);
    setNombre(n);
    setApellido(a);

    if (perfil?.telefono) {
      setTelefono(perfil.telefono);
    }
  }, [perfil, sesionNombre]);

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
          <div className="animate-pulse space-y-4 max-w-xl mx-auto">
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
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Editar Perfil</h1>
          </div>

          <form
            onSubmit={handleGuardar}
            className="rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col items-center bg-white"
          >
            <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-4xl font-bold mb-4 shadow-inner">
              {letraSesion}
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 mb-8 transition-colors"
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
                placeholder="Ingresa tu nombre"
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
                placeholder="Ingresa tu apellido"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

            <div className="w-full mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ingresa tu teléfono"
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