import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Coins, History as IconoHistorial, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Card, EmptyState, PageHeader, SearchBar, Tab } from '../../components/ui/AgroUI';
import { useHistorialGeneral, type EventoHistorial, type FuenteHistorial } from '../../hooks/Historial/useHistorialGeneral';

// Tab recibe string[], asi que la etiqueta es la clave
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
                    title="Historial y auditoría"
                    subtitle="Quién cambió qué y cuándo, en todo lo que puedes ver"
                />

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="mb-4 space-y-3">
                    <Tab tabs={TABS} active={tab} onChange={setTab} />
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

                                <div className="space-y-2">
                                    {lista.map((e) => {
                                        const fuente = FUENTES[e.fuente];
                                        const Icono = fuente.icono;
                                        const campos = Object.entries(e.cambios ?? {});

                                        return (
                                            <Card
                                                key={e.clave}
                                                className={e.actividadId ? 'cursor-pointer' : ''}
                                                onClick={
                                                    e.actividadId
                                                        ? () => navigate('/actividades/' + e.actividadId)
                                                        : undefined
                                                }
                                            >
                                                <div className="flex gap-3">
                                                    <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-icon-bg grid place-items-center">
                                                        <Icono size={16} className="text-primary" />
                                                    </div>

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
                                        );
                                    })}
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
