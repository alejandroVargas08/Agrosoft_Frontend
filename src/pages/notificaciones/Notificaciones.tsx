import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, Bug, CalendarDays, Check, Cpu, Package, UserCheck, type LucideIcon } from 'lucide-react';
import { useNotificacionesContext } from '../../context/NotificacionesContext';
import { tiempoRelativo } from '../../utils/tiempoRelativo';
import DashboardLayout from '../../components/layout/DashboardLayout';

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
    tarea: { icono: CalendarDays, color: 'text-blue-600', fondo: 'bg-blue-50', etiqueta: 'Tarea', ruta: '/mis-tareas' },
    tarea_proxima: { icono: CalendarDays, color: 'text-blue-600', fondo: 'bg-blue-50', etiqueta: 'Tarea', ruta: '/mis-tareas' },
    alerta_sensor: { icono: Cpu, color: 'text-red-500', fondo: 'bg-red-50', etiqueta: 'Sensor', ruta: '/alertas' },
    stock_bajo: { icono: Package, color: 'text-[#F16C07]', fondo: 'bg-[#FFF3E0]', etiqueta: 'Stock', ruta: '/inventario' },
    novedad: { icono: AlertCircle, color: 'text-amber-600', fondo: 'bg-amber-50', etiqueta: 'Novedad', ruta: '/novedades' },
    solicitud: { icono: UserCheck, color: 'text-purple-600', fondo: 'bg-purple-50', etiqueta: 'Solicitud', ruta: '/solicitudes' },
    diagnostico_completado: { icono: Bug, color: 'text-teal-600', fondo: 'bg-teal-50', etiqueta: 'Diagnóstico', ruta: '/wiki-epa' },
};

const POR_DEFECTO: EstiloTipo = { icono: Bell, color: 'text-gray-500', fondo: 'bg-gray-100', etiqueta: 'Sistema' };

const estiloDe = (tipo: string) => TIPOS[tipo] ?? POR_DEFECTO;

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
    const [tipo, setTipo] = useState('');

    // Solo se ofrecen los tipos que de verdad llegaron
    const tiposPresentes = useMemo(
        () => [...new Set(notificaciones.map((n) => n.tipo))],
        [notificaciones],
    );

    const visibles = notificaciones.filter((n) => {
        if (lectura === 'sin_leer' && n.leida) return false;
        if (lectura === 'leidas' && !n.leida) return false;
        if (tipo && n.tipo !== tipo) return false;
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
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Notificaciones</h1>
                        <p className="text-sm text-muted-foreground">
                            {sinLeer === 0 ? 'Todo al día' : sinLeer + ' sin leer'}
                        </p>
                    </div>
                    <button
                        onClick={marcarTodasLeidas}
                        disabled={sinLeer === 0}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2"
                    >
                        <Check size={16} />
                        Marcar todas como leídas
                    </button>
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

                    {tiposPresentes.length > 1 && (
                        <>
                            <span className="text-xs text-muted-foreground">|</span>
                            <button
                                onClick={() => setTipo('')}
                                className={CHIP + (tipo === '' ? CHIP_ACTIVO : CHIP_INACTIVO)}
                            >
                                Todos los tipos
                            </button>
                            {tiposPresentes.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTipo(t)}
                                    className={CHIP + (tipo === t ? CHIP_ACTIVO : CHIP_INACTIVO)}
                                >
                                    {estiloDe(t).etiqueta}
                                </button>
                            ))}
                        </>
                    )}
                </div>

                {cargando && <p className="text-sm text-muted-foreground">Cargando...</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {!cargando && !error && visibles.length === 0 && (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                        {notificaciones.length === 0
                            ? 'No tienes notificaciones'
                            : 'No hay notificaciones con estos filtros'}
                    </p>
                )}

                <div className="space-y-5">
                    {grupos.map((grupo) => (
                        <div key={grupo.dia}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {grupo.dia}
                            </p>
                            <ul className="space-y-2 sm:space-y-3">
                                {grupo.items.map((n) => {
                                    const estilo = estiloDe(n.tipo);
                                    const Icono = estilo.icono;
                                    return (
                                        <li key={n.id}>
                                            <button
                                                onClick={() => alAbrir(n.id, n.leida, estilo.ruta)}
                                                className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition sm:gap-4 sm:p-4 ${
                                                    n.leida
                                                        ? 'border-border bg-card opacity-75 hover:opacity-100'
                                                        : 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                                                }`}
                                            >
                                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${n.leida ? 'bg-muted' : estilo.fondo}`}>
                                                    <Icono size={18} className={n.leida ? 'text-muted-foreground' : estilo.color} />
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
                                                    <span className="block break-words text-sm text-muted-foreground">
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
