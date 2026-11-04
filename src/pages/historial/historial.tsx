import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Coins, History as IconoHistorial, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Card, EmptyState, PageHeader, SearchBar } from '../../components/ui/AgroUI';
import { useHistorialGeneral, type EventoHistorial, type FuenteHistorial } from '../../hooks/Historial/useHistorialGeneral';

const TABS = ['Todo', 'Actividades', 'Precios'];
const FUENTE_DE_TAB: Record<string, FuenteHistorial | null> = {
    Todo: null,
    Actividades: 'actividad',
    Precios: 'precio',
};

const FUENTES: Record<FuenteHistorial, { etiqueta: string; icono: typeof ClipboardList; color: 'primary' | 'info' }> = {
    actividad: { etiqueta: 'Actividad', icono: ClipboardList, color: 'primary' },
    precio: { etiqueta: 'Precio', icono: Coins, color: 'info' },
};

const hoy = new Date().toDateString();
const ayer = new Date(Date.now() - 86400_000).toDateString();

function etiquetaDia(fecha: Date): string {
    const dia = fecha.toDateString();
    if (dia === hoy) return 'Hoy';
    if (dia === ayer) return 'Ayer';
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

const hora = (fecha: Date) =>
    fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

/** Los valores del JSON de cambios llegan como unknown */
function texto(valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    if (typeof valor === 'number') return valor.toLocaleString('es-CO');
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (typeof valor === 'string') return valor;
    return JSON.stringify(valor);
}

const Historial = () => {
    const navigate = useNavigate();
    const { eventos, nombreUsuario, cargando, error } = useHistorialGeneral();
    const [tab, setTab] = useState('Todo');
    const [busqueda, setBusqueda] = useState('');

    const visibles = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        const fuente = FUENTE_DE_TAB[tab] ?? null;
        return eventos.filter((e) => {
            if (fuente !== null && e.fuente !== fuente) return false;
            if (!termino) return true;
            return (
                e.titulo.toLowerCase().includes(termino) ||
                e.motivo.toLowerCase().includes(termino) ||
                nombreUsuario(e.usuarioId).toLowerCase().includes(termino)
            );
        });
    }, [eventos, tab, busqueda, nombreUsuario]);

    // Se agrupa por día para que la línea de tiempo se lea de un vistazo
    const porDia = useMemo(() => {
        const grupos = new Map<string, EventoHistorial[]>();
        for (const e of visibles) {
            const clave = etiquetaDia(e.fecha);
            const lista = grupos.get(clave);
            if (lista) lista.push(e);
            else grupos.set(clave, [e]);
        }
        return [...grupos.entries()];
    }, [visibles]);

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <PageHeader
                    title="Historial y Auditoría"
                    subtitle="Quién cambió qué y cuándo, en todo lo que puedes ver"
                />

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="mb-4 space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {TABS.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTab(t)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                    tab === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <SearchBar
                        value={busqueda}
                        onChange={setBusqueda}
                        placeholder="Buscar por actividad, motivo o persona..."
                    />
                </div>

                {cargando ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Cargando historial…</p>
                ) : visibles.length === 0 ? (
                    <EmptyState
                        icon={IconoHistorial}
                        title={busqueda ? 'Sin resultados' : 'Todavía no hay cambios registrados'}
                        description={
                            busqueda
                                ? `Nada coincide con “${busqueda}”.`
                                : 'Cuando alguien modifique una actividad o el precio de un lote, el cambio aparecerá aquí.'
                        }
                    />
                ) : (
                    <div className="space-y-6">
                        {porDia.map(([dia, lista]) => (
                            <section key={dia}>
                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {dia}
                                </h2>

                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                                    <div className="space-y-4 pl-10">
                                    {lista.map((e) => {
                                        const fuente = FUENTES[e.fuente];
                                        const Icono = fuente.icono;
                                        const campos = Object.entries(e.cambios ?? {});

                                        return (
                                            <div key={e.clave} className="relative">
                                                <div className="absolute -left-10 w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                                                    <Icono size={14} className="text-primary" />
                                                </div>
                                            <Card
                                                className={e.actividadId ? 'cursor-pointer' : ''}
                                                onClick={
                                                    e.actividadId
                                                        ? () => navigate('/actividades/' + e.actividadId)
                                                        : undefined
                                                }
                                            >
                                                <div className="flex gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-semibold text-foreground">{e.titulo}</p>
                                                            <Badge color={fuente.color}>{fuente.etiqueta}</Badge>
                                                            <span className="ml-auto text-xs text-muted-foreground">
                                                                {hora(e.fecha)}
                                                            </span>
                                                        </div>

                                                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <User size={12} />
                                                            {nombreUsuario(e.usuarioId)}
                                                        </p>

                                                        <p className="mt-1.5 text-sm text-foreground">{e.motivo}</p>

                                                        {campos.length > 0 && (
                                                            <div className="mt-2 space-y-1">
                                                                {campos.map(([campo, valor]) => (
                                                                    <div
                                                                        key={campo}
                                                                        className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs"
                                                                    >
                                                                        <span className="font-semibold text-foreground">
                                                                            {campo}
                                                                        </span>
                                                                        <span className="text-red-600 line-through">
                                                                            {texto(valor?.anterior)}
                                                                        </span>
                                                                        <span className="text-muted-foreground">→</span>
                                                                        <span className="font-medium text-emerald-700">
                                                                            {texto(valor?.nuevo)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                            </div>
                                        );
                                    })}
                                    </div>
                                </div>
                            </section>
                        ))}

                        <p className="pt-2 text-center text-xs text-muted-foreground">
                            {visibles.length} cambio{visibles.length === 1 ? '' : 's'}.
                            {' '}El historial de cultivo no entra aquí: el backend solo lo expone por cultivo,
                            y se ve en el detalle de cada uno.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Historial;
