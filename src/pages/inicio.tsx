import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, BookOpen, ChevronRight, ClipboardList, Cpu, DollarSign,
  Map, Package, ShoppingCart, Sprout, type LucideIcon,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { InicioUsuario } from '../hooks/useAuth';
import { useInicio } from '../hooks/Inicio/useInicio';
import { useNotificacionesContext } from '../context/NotificacionesContext';
import type { Actividad } from '../types/actividades';

const ACCESOS: { label: string; path: string; icono: LucideIcon; color: string }[] = [
  { label: 'Unidades Productivas', path: '/unidades-productivas', icono: Sprout, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Lotes y Sublotes', path: '/territorio', icono: Map, color: 'bg-green-700 text-white' },
  { label: 'Actividades', path: '/actividades', icono: ClipboardList, color: 'bg-blue-50 text-blue-600' },
  { label: 'Incidencias', path: '/incidencias', icono: AlertTriangle, color: 'bg-red-50 text-red-600' },
  { label: 'Inventario', path: '/inventario', icono: Package, color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Ventas', path: '/ventas', icono: ShoppingCart, color: 'bg-purple-50 text-purple-600' },
  { label: 'Wiki EPA', path: '/wiki-epa', icono: BookOpen, color: 'bg-teal-50 text-teal-600' },
  { label: 'Sensores IoT', path: '/sensores-iot', icono: Cpu, color: 'bg-indigo-50 text-indigo-600' },
];

const ESTADOS_ACTIVIDAD: Record<string, { texto: string; clase: string }> = {
  completada: { texto: 'Completada', clase: 'bg-green-700 text-white' },
  finalizada: { texto: 'Completada', clase: 'bg-green-700 text-white' },
  en_progreso: { texto: 'En progreso', clase: 'bg-orange-50 text-orange-600' },
  pendiente: { texto: 'Pendiente', clase: 'bg-red-50 text-red-600' },
};

const formatoPesos = (valor: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);

const formatoFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

function TarjetaResumen({ label, valor, icono: Icono, color, cargando }: {
  label: string; valor: string; icono: LucideIcon; color: string; cargando: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${color}`}>
        <Icono className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        {cargando ? (
          <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-100" />
        ) : (
          <p className="truncate text-2xl font-bold text-gray-900">{valor}</p>
        )}
      </div>
    </div>
  );
}

function FilaActividad({ actividad }: { actividad: Actividad }) {
  const clave = (actividad.estado ?? 'pendiente').toLowerCase().replace(' ', '_');
  const estado = ESTADOS_ACTIVIDAD[clave] ?? ESTADOS_ACTIVIDAD.pendiente;
  const titulo = actividad.subtipo ? `${actividad.tipo} — ${actividad.subtipo}` : actividad.nombre || actividad.tipo;

  return (
    <Link
      to={`/actividades/${actividad.id}`}
      className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0 hover:bg-gray-50"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-900">{titulo}</p>
        <p className="text-sm text-gray-500">{formatoFecha(actividad.fecha)}</p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}>
        {estado.texto}
      </span>
    </Link>
  );
}

export default function Inicio() {
  const { user } = InicioUsuario();
  const displayName = user?.nombre || user?.nombres || user?.name || 'Usuario';
  const primerNombre = displayName.split(' ')[0];
  const nombreFormateado = primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1);

  const { sinLeer } = useNotificacionesContext();
  const {
    unidadesActivas, incidenciasAbiertas, ventasDelMes, sensoresEnLinea, sensoresTotal,
    actividadesRecientes, produccion,
    cargandoResumen, cargandoActividades, cargandoProduccion,
  } = useInicio();

  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(intervalo);
  }, []);

  const hora = ahora.getHours();
  const saludo = hora >= 6 && hora < 12 ? 'Buenos días' : hora >= 12 && hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const fechaHoy = ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {saludo}, {nombreFormateado} 👋
          </h1>
          <p className="mt-1 text-gray-500">Resumen de hoy — {fechaHoy}</p>
        </div>

        {sinLeer > 0 && (
          <Link
            to="/notificaciones"
            className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-orange-600 transition-colors hover:bg-orange-100"
          >
            <span className="flex items-center gap-3 font-medium">
              <AlertTriangle className="h-5 w-5" />
              Tienes {sinLeer} {sinLeer === 1 ? 'notificación sin leer' : 'notificaciones sin leer'}
            </span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TarjetaResumen label="Unidades Activas" valor={String(unidadesActivas)} icono={Sprout}
            color="bg-emerald-50 text-emerald-600" cargando={cargandoResumen} />
          <TarjetaResumen label="Incidencias Abiertas" valor={String(incidenciasAbiertas)} icono={AlertTriangle}
            color="bg-red-50 text-red-600" cargando={cargandoResumen} />
          <TarjetaResumen label="Ventas del Mes" valor={formatoPesos(ventasDelMes)} icono={DollarSign}
            color="bg-green-700 text-white" cargando={cargandoResumen} />
          <TarjetaResumen label="Sensores Activos" valor={`${sensoresEnLinea}/${sensoresTotal}`} icono={Cpu}
            color="bg-indigo-50 text-indigo-600" cargando={cargandoResumen} />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ACCESOS.map(({ label, path, icono: Icono, color }) => (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`grid h-14 w-14 place-items-center rounded-xl ${color}`}>
                <Icono className="h-7 w-7" />
              </div>
              <span className="text-sm font-semibold text-gray-900">{label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-gray-900">Actividades recientes</h2>
            {cargandoActividades ? (
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((n) => <div key={n} className="h-12 animate-pulse rounded bg-gray-100" />)}
              </div>
            ) : actividadesRecientes.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">Aún no hay actividades registradas.</p>
            ) : (
              actividadesRecientes.map((a) => <FilaActividad key={a.id} actividad={a} />)
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Producción (kg)</h2>
            {cargandoProduccion ? (
              <div className="h-56 animate-pulse rounded bg-gray-100" />
            ) : produccion.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No hay datos de producción.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={produccion}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`${v} kg`, 'Producción']} />
                    <Bar dataKey="kg" fill="#4CAF7A" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}