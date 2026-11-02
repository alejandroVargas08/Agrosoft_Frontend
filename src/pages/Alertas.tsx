import { CheckCircle, Clock, Cpu, Package, X } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { EmptyState, PageHeader } from '../components/ui/AgroUI';
import { useAlertas } from '../hooks/useAlertas';
import type { SeveridadAlerta, TipoAlerta } from '../types/alertas';

// La fila completa: borde y fondo según la gravedad
const COLOR_BORDE: Record<SeveridadAlerta, string> = {
    high: 'border-red-200',
    medium: 'border-[#F16C07]/30',
    low: 'border-blue-200',
};

const COLOR_FONDO: Record<SeveridadAlerta, string> = {
    high: 'bg-red-50',
    medium: 'bg-[#FFF3E0]/50',
    low: 'bg-blue-50/50',
};

const COLOR_ICONO: Record<TipoAlerta, string> = {
    sensor: 'text-[#F16C07]',
    stock: 'text-red-500',
    task: 'text-blue-500',
};

const ICONO: Record<TipoAlerta, typeof Cpu> = {
    sensor: Cpu, stock: Package, task: Clock,
};

const Alertas = () => {
    const { alertas, total, cargando, error, descartar } = useAlertas();

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader title="Alertas" subtitle={total + ' alertas activas'} />

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
                )}

                {cargando && <p className="text-sm text-muted-foreground">Cargando alertas...</p>}

                {!cargando && !error && alertas.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        title="Sin alertas activas"
                        description="Todo está dentro de los rangos normales."
                    />
                ) : (
                    <div className="space-y-3">
                        {alertas.map((a) => {
                            const Icono = ICONO[a.tipo];
                            return (
                                <div
                                    key={a.id}
                                    className={`p-4 rounded-xl border ${COLOR_BORDE[a.severidad]} ${COLOR_FONDO[a.severidad]}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/80 rounded-lg shrink-0">
                                            <Icono size={14} className={COLOR_ICONO[a.tipo]} />
                                        </div>

                                        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Origen</p>
                                                <p className="font-semibold text-foreground text-xs truncate" title={a.origen}>{a.origen}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Medición</p>
                                                <p className="font-semibold text-foreground text-xs truncate">{a.medicion}</p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                                    {a.umbral ? 'Valor vs Umbral' : 'Valor'}
                                                </p>
                                                <p className="font-semibold text-xs text-red-700 truncate">
                                                    {a.umbral ? `${a.valor} · umbral ${a.umbral}` : a.valor}
                                                </p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fecha</p>
                                                <p className="text-xs text-muted-foreground truncate">{a.fecha || '—'}</p>
                                            </div>
                                        </div>

                                        <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                                            Activa
                                        </span>

                                        {/* Solo las de sensor se pueden descartar: el backend las borra */}
                                        {a.tipo === 'sensor' && (
                                            <button
                                                type="button"
                                                title="Descartar alerta"
                                                onClick={() => descartar(a.idOriginal)}
                                                className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
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
