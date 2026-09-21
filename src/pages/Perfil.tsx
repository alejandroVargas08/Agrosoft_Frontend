import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Pencil, GraduationCap, CheckCircle2 } from 'lucide-react';
import { usePerfil } from '../hooks/usePerfil';
import DashboardLayout from '../componets/layout/DashboardLayout';

function formatearFecha(fecha?: string) {
  if (!fecha) return 'No registrada';
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function inicial(nombre?: string) {
  return nombre?.trim()?.charAt(0)?.toUpperCase() ?? '?';
}

export default function Perfil() {
  const { perfil, cargando, error } = usePerfil();

  if (cargando) {
    return (
      <div className="p-4 sm:p-8">
        <div className="animate-pulse space-y-4 max-w-5xl">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl md:col-span-1" />
            <div className="h-64 bg-gray-200 rounded-xl md:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-xl bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-xl bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          Tu perfil no fue encontrado.
        </div>
      </div>
    );
  }

  const { nombre, email, telefono, ubicacion, rol, emailVerificado, programaFormacion } = perfil;

  return (
    <DashboardLayout unreadNotifications={2}>
      <div className="p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mi Perfil</h1>
            <Link
              to="/editar-perfil"
              className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              style={{ backgroundColor: '#ffffff' }}
            >
              <Pencil size={16} />
              Editar
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="md:col-span-1 rounded-xl shadow-sm p-6 flex flex-col items-center text-center"
              style={{ backgroundColor: '#ffffff' }}
            >
              <div className="w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-3xl font-bold mb-4">
                {inicial(nombre)}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{nombre || 'Sin nombre'}</h2>
              <p className="text-sm text-gray-500 mb-3">{email || 'Correo no registrado'}</p>
              <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                {rol || 'Usuario'}
              </span>
              {emailVerificado && (
                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle2 size={14} />
                  Correo verificado
                </span>
              )}
            </div>

            <div className="md:col-span-2 flex flex-col gap-6">
              <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: '#ffffff' }}>
                <h3 className="text-base font-bold text-gray-900 mb-4">Información personal</h3>
                <div className="divide-y divide-gray-100">
                  <div className="flex items-start gap-3 py-3">
                    <Mail size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Correo</p>
                      <p className="text-sm font-medium text-gray-900">
                        {email || 'No registrado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3">
                    <Phone size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="text-sm font-medium text-gray-900">
                        {telefono || 'No registrado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Ubicación</p>
                      <p className="text-sm font-medium text-gray-900">
                        {ubicacion || 'No registrada'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {programaFormacion ? (
                <div className="rounded-xl p-6" style={{ backgroundColor: '#eef6ee' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap size={18} className="text-green-700" />
                    <h3 className="text-base font-bold text-gray-900">
                      Programa de Formación SENA
                    </h3>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Programa:</dt>
                      <dd className="font-medium text-gray-900">{programaFormacion.nombre}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Tipo:</dt>
                      <dd className="font-medium text-gray-900">{programaFormacion.tipo}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Ficha:</dt>
                      <dd className="font-medium text-green-700">{programaFormacion.ficha}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <dt className="text-gray-500">Vigencia:</dt>
                      <dd className="font-medium text-gray-900">
                        {formatearFecha(programaFormacion.fechaInicio)} —{' '}
                        {formatearFecha(programaFormacion.fechaFin)}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-gray-500">Estado:</dt>
                      <dd>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {programaFormacion.estado}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div
                  className="rounded-xl p-6 text-sm text-gray-500"
                  style={{ backgroundColor: '#eef6ee' }}
                >
                  Aún no tienes un programa de formación registrado.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}