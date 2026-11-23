import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Bell, Bug, CalendarDays, Check, Cpu, Package, UserCheck, type LucideIcon } from 'lucide-react';
import { useNotificacionesContext } from '../../context/NotificacionesContext';
import { tiempoRelativo } from '../../utils/tiempoRelativo';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, EmptyState } from '../../components/ui/AgroUI';

interface EstiloTipo {
    icono: LucideIcon;
    color: string;
    fondo: string;
    etiqueta: string;
    /** A dónde lleva la notificación. El backend no guarda la pantalla
     *  destino, así que se deduce del tipo. */
    ruta?: string;
}

const TIPOS: Record<string, EstiloTipo> = {
    tarea: { icono: CalendarDays, color: 'text-blue-500', fondo: 'bg-blue-100', etiqueta: 'Tarea', ruta: '/mis-tareas' },
    tarea_proxima: { icono: CalendarDays, color: 'text-blue-500', fondo: 'bg-blue-100', etiqueta: 'Tarea', ruta: '/mis-tareas' },
    alerta_sensor: { icono: Cpu, color: 'text-red-500', fondo: 'bg-red-100', etiqueta: 'Sensor', ruta: '/alertas' },
    stock_bajo: { icono: Package, color: 'text-[#F16C07]', fondo: 'bg-[#FFF3E0]', etiqueta: 'Stock', ruta: '/inventario' },
    novedad: { icono: AlertCircle, color: 'text-amber-600', fondo: 'bg-amber-100', etiqueta: 'Novedad', ruta: '/novedades' },
    diagnostico_completado: { icono: Bug, color: 'text-purple-500', fondo: 'bg-purple-100', etiqueta: 'Diagnóstico', ruta: '/wiki-epa' },
    // Incidencia no tiene chip en el diseño: sale en "Todos los tipos"
    incidencia: { icono: AlertTriangle, color: 'text-red-500', fondo: 'bg-red-100', etiqueta: 'Incidencia', ruta: '/incidencias' },
    // Solicitud no existe en el diseño: se le deja el cian que allá usan los drones
    solicitud: { icono: UserCheck, color: 'text-cyan-600', fondo: 'bg-cyan-100', etiqueta: 'Solicitud', ruta: '/solicitudes' },
};

const POR_DEFECTO: EstiloTipo = { icono: Bell, color: 'text-primary', fondo: 'bg-icon-bg', etiqueta: 'Sistema' };

const estiloDe = (tipo: string) => TIPOS[tipo] ?? POR_DEFECTO;

/**
 * Los chips de tipo del diseño, que van siempre todos, haya o no
 * notificaciones de esa clase. Cada uno agrupa los tipos que manda el
 * backend: "Tarea" cubre tarea y tarea_proxima.
 */
const CATEGORIAS: { label: string; tipos: string[] }[] = [
    { label: 'Sensor', tipos: ['alerta_sensor'] },
    { label: 'Stock', tipos: ['stock_bajo'] },
    { label: 'Tarea', tipos: ['tarea', 'tarea_proxima'] },
    { label: 'Diagnóstico', tipos: ['diagnostico_completado'] },
    { label: 'Novedad', tipos: ['novedad'] },
    { label: 'Solicitud', tipos: ['solicitud'] },
];

const LECTURA = [
    { valor: 'todas', label: 'Todas' },
    { valor: 'sin_leer', label: 'Sin leer' },
    { valor: 'leidas', label: 'Leídas' },
] as const;

type FiltroLectura = (typeof LECTURA)[number]['valor'];

const CHIP = 'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ';
const CHIP_ACTIVO = 'bg-primary text-white';
const CHIP_INACTIVO = 'bg-muted text-muted-foreground hover:bg-primary/10';

/** Hoy, Ayer, o la fecha larga. */
function etiquetaDelDia(iso: string) {
    const fecha = new Date(iso);
    const dia = new Date(fecha); dia.setHours(0, 0, 0, 0);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);

    if (dia.getTime() === hoy.getTime()) return 'Hoy';
    if (dia.getTime() === ayer.getTime()) return 'Ayer';
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Notificaciones() {
    const { notificaciones, cargando, error, sinLeer, marcarLeida, marcarTodasLeidas } =
        useNotificacionesContext();
    const navigate = useNavigate();

    const [lectura, setLectura] = useState<FiltroLectura>('todas');
    const [categoria, setCategoria] = useState('');

    const tiposDeLaCategoria = useMemo(
        () => CATEGORIAS.find((c) => c.label === categoria)?.tipos ?? null,
        [categoria],
    );

    const visibles = notificaciones.filter((n) => {
        if (lectura === 'sin_leer' && n.leida) return false;
        if (lectura === 'leidas' && !n.leida) return false;
        if (tiposDeLaCategoria && !tiposDeLaCategoria.includes(n.tipo)) return false;
        return true;
    });

    // Agrupadas por día, conservando el orden en que llegan
    const grupos: { dia: string; items: typeof visibles }[] = [];
    for (const n of visibles) {
        const dia = etiquetaDelDia(n.creadoEn);
        const ultimo = grupos[grupos.length - 1];
        if (ultimo && ultimo.dia === dia) ultimo.items.push(n);
        else grupos.push({ dia, items: [n] });
    }

    const alAbrir = (id: number, leida: boolean, rutaTipo?: string) => {
        if (!leida) marcarLeida(id);
        if (rutaTipo) navigate(rutaTipo);
    };

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Notificaciones</h1>
                        <p className="text-sm text-muted-foreground">{sinLeer} sin leer</p>
                    </div>
                    <Btn variant="outline" size="sm" onClick={marcarTodasLeidas} disabled={sinLeer === 0}>
                        <Check size={14} />Marcar todas como leídas
                    </Btn>
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-2">
                    {LECTURA.map((f) => (
                        <button
                            key={f.valor}
                            onClick={() => setLectura(f.valor)}
                            className={CHIP + (lectura === f.valor ? CHIP_ACTIVO : CHIP_INACTIVO)}
                        >
                            {f.label}
                        </button>
                    ))}

                    <span className="text-xs text-muted-foreground">|</span>
                    <button
                        onClick={() => setCategoria('')}
                        className={CHIP + (categoria === '' ? CHIP_ACTIVO : CHIP_INACTIVO)}
                    >
                        Todos los tipos
                    </button>
                    {CATEGORIAS.map((c) => (
                        <button
                            key={c.label}
                            onClick={() => setCategoria(c.label)}
                            className={CHIP + (categoria === c.label ? CHIP_ACTIVO : CHIP_INACTIVO)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                {cargando && <p className="text-sm text-muted-foreground">Cargando...</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {!cargando && !error && visibles.length === 0 && (
                    <EmptyState
                        icon={Bell}
                        title="Sin notificaciones"
                        description={
                            notificaciones.length === 0
                                ? 'No tienes notificaciones'
                                : 'No hay notificaciones con los filtros seleccionados'
                        }
                    />
                )}

                <div className="space-y-4">
                    {grupos.map((grupo) => (
                        <div key={grupo.dia}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {grupo.dia}
                            </p>
                            <ul className="space-y-2">
                                {grupo.items.map((n) => {
                                    const estilo = estiloDe(n.tipo);
                                    const Icono = estilo.icono;
                                    return (
                                        <li key={n.id}>
                                            <button
                                                onClick={() => alAbrir(n.id, n.leida, estilo.ruta)}
                                                className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                                                    n.leida
                                                        ? 'border-border bg-card opacity-70'
                                                        : 'border-primary/20 bg-primary/5'
                                                }`}
                                            >
                                                <span className={`shrink-0 rounded-lg p-2 ${n.leida ? 'bg-muted' : estilo.fondo}`}>
                                                    <Icono size={16} className={n.leida ? 'text-muted-foreground' : estilo.color} />
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-start justify-between gap-2">
                                                        <span className={`block break-words text-sm font-semibold ${n.leida ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                            {n.titulo}
                                                        </span>
                                                        <span className="flex shrink-0 items-center gap-1.5">
                                                            {!n.leida && <span className="h-2 w-2 rounded-full bg-primary" />}
                                                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                                {estilo.etiqueta}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <span className="mt-0.5 line-clamp-2 block break-words text-xs text-muted-foreground">
                                                        {n.mensaje}
                                                    </span>
                                                    <span className="mt-1 block text-xs text-muted-foreground">
                                                        {tiempoRelativo(n.creadoEn)}
                                                    </span>
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
