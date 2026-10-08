import { Bell, Bug, CalendarDays, Check, Cpu, Package, type LucideIcon } from 'lucide-react';
import { useNotificaciones } from '../../hooks/notificaciones/useNotificaciones';
import { tiempoRelativo } from '../../utils/tiempoRelativo';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ICONOS: Record<string, { icono: LucideIcon; color: string; fondo: string }> = {
  alerta_sensor: { icono: Cpu, color: 'text-red-500', fondo: 'bg-red-50' },
  stock_bajo: { icono: Package, color: 'text-amber-500', fondo: 'bg-amber-50' },
  tarea_proxima: { icono: CalendarDays, color: 'text-gray-500', fondo: 'bg-gray-100' },
  diagnostico_completado: { icono: Bug, color: 'text-gray-500', fondo: 'bg-gray-100' },
};

const ICONO_DEFECTO = { icono: Bell, color: 'text-gray-500', fondo: 'bg-gray-100' };

export default function Notificaciones() {
  const { notificaciones, cargando, error, sinLeer, marcarLeida, marcarTodasLeidas } =
    useNotificaciones();

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Notificaciones</h1>
            <p className="text-sm text-gray-500">
              {sinLeer === 0 ? 'Todo al día' : `${sinLeer} sin leer`}
            </p>
          </div>
          <button
            onClick={marcarTodasLeidas}
            disabled={sinLeer === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2"
          >
            <Check size={16} />
            Marcar todas como leídas
          </button>
        </div>

        {cargando && <p className="text-sm text-gray-500">Cargando...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!cargando && !error && notificaciones.length === 0 && (
          <p className="py-16 text-center text-sm text-gray-500">No tienes notificaciones</p>
        )}

        <ul className="space-y-2 sm:space-y-3">
          {notificaciones.map((n) => {
            const { icono: Icono, color, fondo } = ICONOS[n.tipo] ?? ICONO_DEFECTO;
            return (
              <li key={n.id}>
                <button
                  onClick={() => !n.leida && marcarLeida(n.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition sm:gap-4 sm:p-4 ${
                    n.leida
                      ? 'border-gray-100 bg-white'
                      : 'border-green-200 bg-green-50 hover:bg-green-100/70'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${fondo}`}
                  >
                    <Icono size={18} className={color} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block break-words text-sm font-semibold ${
                        n.leida ? 'text-gray-500' : 'text-gray-900'
                      }`}
                    >
                      {n.titulo}
                    </span>
                    <span
                      className={`block break-words text-sm ${
                        n.leida ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {n.mensaje}
                </span>
                    <span className="mt-1 block text-xs text-gray-400">
                        {tiempoRelativo(n.creadoEn)}
                    </span>
                  </span>

                  {!n.leida && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-700" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardLayout>
  );
}

