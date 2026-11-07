import {
    AlertTriangle, CheckCircle, Clock, Droplets, FlaskConical, Lightbulb,
    Package, Sun, Thermometer, WifiOff, type LucideIcon,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { EmptyState, PageHeader } from '../components/ui/AgroUI';
import { useAlertas } from '../hooks/useAlertas';
import type { SeveridadAlerta, TipoAlerta } from '../types/alertas';

// La fila completa: borde y fondo segun la gravedad.
const COLOR_BORDE: Record<SeveridadAlerta, string> = {
    high: 'border-red-200',
    medium: 'border-amber-200',
};

const COLOR_FONDO: Record<SeveridadAlerta, string> = {
    high: 'bg-red-50',
    medium: 'bg-[#FFF3E0]/50',
};

// El icono sale de la medicion, no del tipo de alerta.
const ICONO_MEDICION: Record<string, { icono: LucideIcon; color: string }> = {
    Temperatura: { icono: Thermometer, color: 'text-[#F16C07]' },
    Humedad: { icono: Droplets, color: 'text-blue-500' },
    'Índice UV': { icono: Sun, color: 'text-[#F59E0B]' },
    Luminosidad: { icono: Lightbulb, color: 'text-[#F59E0B]' },
    pH: { icono: FlaskConical, color: 'text-primary' },
    Desconectada: { icono: WifiOff, color: 'text-red-500' },
};

// Para las que no son de sensor y no tienen medicion en esa lista.
const ICONO_TIPO: Record<TipoAlerta, { icono: LucideIcon; color: string }> = {
    sensor: { icono: AlertTriangle, color: 'text-[#F16C07]' },
    stock: { icono: Package, color: 'text-red-500' },
    task: { icono: Clock, color: 'text-blue-500' },
};

const Alertas = () => {
    const { alertas, total, cargando, error } = useAlertas();

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <PageHeader title="Alertas" subtitle={total + ' alertas activas'} />

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
                )}

                {cargando && <p className="text-sm text-muted-foreground">Cargando alertas...</p>}

                {!cargando && !error && alertas.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        title="Sin alertas activas"
                        description="Todas las estaciones dentro del rango normal."
                    />
                ) : (
                    <div className="space-y-3">
                        {alertas.map((a) => {
                            const { icono: Icono, color } = ICONO_MEDICION[a.medicion] ?? ICONO_TIPO[a.tipo];
                            return (
                                <div
                                    key={a.id}
                                    className={`rounded-xl border p-4 ${COLOR_BORDE[a.severidad]} ${COLOR_FONDO[a.severidad]}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="shrink-0 rounded-lg bg-white/80 p-2">
                                            <Icono size={14} className={color} />
                                        </div>

                                        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                    {a.tipo === 'sensor' ? 'Estación' : 'Origen'}
                                                </p>
                                                <p className="truncate text-xs font-semibold text-foreground" title={a.origen}>{a.origen}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Medición</p>
                                                <p className="truncate text-xs font-semibold text-foreground">{a.medicion}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                    {a.umbral ? 'Valor vs Umbral' : 'Valor'}
                                                </p>
                                                <p className="truncate text-xs font-semibold text-red-700">
                                                    {a.umbral ? a.valor + ' > ' + a.umbral : a.valor}
                                                </p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Fecha</p>
                                                <p className="truncate text-xs text-muted-foreground">{a.fecha || '—'}</p>
                                            </div>
                                        </div>

                                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                                            Activa
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Alertas;
