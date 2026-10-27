import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, BookOpen, ChevronRight, ClipboardList, Cpu, DollarSign,
  Map as MapIcon, Package, ShoppingCart, Sprout, type LucideIcon,
} from 'lucide-react';
import { Bar, BarChart as ReBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, StatCard, StatusBadge } from '../components/ui/AgroUI';
import { InicioUsuario } from '../hooks/useAuth';
import { useInicio } from '../hooks/Inicio/useInicio';
import { useNotificacionesContext } from '../context/NotificacionesContext';
import { insumosApi } from '../api/inventario';
import type { Actividad } from '../types/actividades';

// Los colores son los del Figma, no los de Reportes
const COLORES = ['#2d7a3e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

const ACCESOS: { label: string; path: string; icono: LucideIcon; color: string }[] = [
  { label: 'Unidades Productivas', path: '/unidades-productivas', icono: Sprout, color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Lotes y Sublotes', path: '/territorio', icono: MapIcon, color: 'bg-chip-bg text-chip-fg' },
  { label: 'Actividades', path: '/actividades', icono: ClipboardList, color: 'bg-blue-100 text-blue-700' },
  { label: 'Incidencias', path: '/incidencias', icono: AlertTriangle, color: 'bg-red-100 text-red-700' },
  { label: 'Inventario', path: '/inventario', icono: Package, color: 'bg-blue-100 text-blue-700' },
  { label: 'Ventas', path: '/ventas', icono: ShoppingCart, color: 'bg-purple-100 text-purple-700' },
  { label: 'Wiki EPA', path: '/wiki-epa', icono: BookOpen, color: 'bg-teal-100 text-teal-700' },
  { label: 'Sensores IoT', path: '/sensores-iot', icono: Cpu, color: 'bg-indigo-100 text-indigo-700' },
];

const fmtPesos = (valor: number) =>
  '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

const fmtFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

function FilaActividad({ actividad }: { actividad: Actividad }) {
  const titulo = actividad.subtipo
    ? `${actividad.tipo} — ${actividad.subtipo}`
    : actividad.nombre || actividad.tipo;

  return (
    <Link
      to={`/actividades/${actividad.id}`}
      className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{titulo}</p>
        <p className="text-xs text-muted-foreground">{fmtFecha(actividad.fecha)}</p>
      </div>
      <StatusBadge status={actividad.estado ?? 'pendiente'} />
    </Link>
  );
}

export default function Inicio() {
  const navigate = useNavigate();
  const { user } = InicioUsuario();
  const displayName = user?.nombre || user?.nombres || user?.name || 'Usuario';
  const primerNombre = displayName.split(' ')[0];
  const nombreFormateado = primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1);

  const { sinLeer } = useNotificacionesContext();
  const {
    unidadesActivas, incidenciasAbiertas, ventasDelMes, sensoresEnLinea, sensoresTotal,
    actividadesRecientes, produccion, cultivos,
    cargandoResumen, cargandoActividades, cargandoProduccion,
  } = useInicio();

  // El aviso de stock bajo del Figma: no lo teníamos
  const bajoStock = useQuery({
    queryKey: ['insumos-bajo-stock'],
    queryFn: async () => (await insumosApi.listarBajoStock()).data,
    staleTime: 60_000,
  });
  const faltantes = bajoStock.data?.length ?? 0;

  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  const hora = ahora.getHours();
  const saludo = hora >= 6 && hora < 12 ? 'Buenos días' : hora >= 12 && hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const fechaHoy = ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  // Las últimas tres, como en el Figma
  const ultimaProduccion = produccion.slice(-3);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {saludo}, {nombreFormateado} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumen de hoy — {fechaHoy}</p>
        </div>

        {sinLeer > 0 && (
          <div
            onClick={() => navigate('/notificaciones')}
            className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-[#F16C07]/30 bg-[#FFF3E0] p-3 transition hover:bg-[#FFE0B2]"
          >
            <AlertTriangle size={18} className="shrink-0 text-[#F16C07]" />
            <p className="text-sm font-medium text-[#E65100]">
              Tienes {sinLeer} {sinLeer === 1 ? 'notificación sin leer' : 'notificaciones sin leer'}
            </p>
            <ChevronRight size={16} className="ml-auto text-[#F16C07]" />
          </div>
        )}

        {faltantes > 0 && (
          <div
            onClick={() => navigate('/inventario')}
            className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 transition hover:bg-red-100"
          >
            <Package size={18} className="shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              {faltantes} insumo{faltantes === 1 ? '' : 's'} con stock bajo
            </p>
            <ChevronRight size={16} className="ml-auto text-red-400" />
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Sprout} label="Unidades Activas" color="emerald"
            value={cargandoResumen ? '—' : unidadesActivas}
          />
          <StatCard
            icon={AlertTriangle} label="Incidencias Abiertas" color="red"
            value={cargandoResumen ? '—' : incidenciasAbiertas}
          />
          <StatCard
            icon={DollarSign} label="Ventas del Mes" color="primary"
            value={cargandoResumen ? '—' : fmtPesos(ventasDelMes)}
          />
          <StatCard
            icon={Cpu} label="Sensores Activos" color="blue"
            value={cargandoResumen ? '—' : `${sensoresEnLinea}/${sensoresTotal}`}
          />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ACCESOS.map(({ label, path, icono: Icono, color }) => (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:shadow-md"
            >
              <div className={`rounded-xl p-3 ${color}`}>
                <Icono size={22} />
              </div>
              <span className="text-xs font-semibold leading-tight text-foreground">{label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-3 font-semibold text-foreground">Actividades recientes</h3>
            {cargandoActividades ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => <div key={n} className="h-12 animate-pulse rounded bg-muted" />)}
              </div>
            ) : actividadesRecientes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no hay actividades registradas.
              </p>
            ) : (
              actividadesRecientes.map((a) => <FilaActividad key={a.id} actividad={a} />)
            )}
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-foreground">Producción este mes (kg)</h3>
            {cargandoProduccion ? (
              <div className="h-[150px] animate-pulse rounded bg-muted" />
            ) : ultimaProduccion.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay datos de producción.</p>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <ReBarChart data={ultimaProduccion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e6" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  {cultivos.map((cultivo, i) => (
                    <Bar
                      key={cultivo}
                      dataKey={cultivo}
                      name={cultivo}
                      fill={COLORES[i % COLORES.length]}
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
                </ReBarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
