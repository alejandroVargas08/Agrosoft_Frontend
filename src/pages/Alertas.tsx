import { Clock, Cpu, Package, X } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { EmptyState, PageHeader } from '../components/ui/AgroUI';
import { useAlertas } from '../hooks/useAlertas';
import type { SeveridadAlerta, TipoAlerta } from '../types/alertas';

const COLOR_TARJETA: Record<SeveridadAlerta, string> = {
    high: 'bg-red-100 border-red-200',
    medium: 'bg-[#FFF3E0] border-[#F16C07]/30',
    low: 'bg-blue-50 border-blue-200',
};

const COLOR_BADGE: Record<SeveridadAlerta, string> = {
    high: 'bg-red-200 text-red-700',
    medium: 'bg-[#FFF3E0] text-[#F16C07]',
    low: 'bg-blue-100 text-blue-700',
};

const TEXTO_SEVERIDAD: Record<SeveridadAlerta, string> = {
    high: 'Alta', medium: 'Media', low: 'Baja',
};

const TEXTO_TIPO: Record<TipoAlerta, string> = {
    sensor: 'Sensor', stock: 'Stock', task: 'Tarea',
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
                        icon={Clock}
                        title="Sin alertas activas"
                        description="Todo está dentro de los rangos normales"
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {alertas.map((a) => {
                            const Icono = ICONO[a.tipo];
                            const esAlta = a.severidad === 'high';
                            return (
                                <div key={a.id} className={'p-3 rounded-xl border ' + COLOR_TARJETA[a.severidad]}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={'p-1.5 rounded-lg ' + (esAlta ? 'bg-red-200' : 'bg-[#FFF3E0]')}>
                                            <Icono size={14} className={esAlta ? 'text-red-700' : 'text-[#F16C07]'} />
                                        </div>
                                        {a.tipo === 'sensor' && (
                                            <button
                                                type="button"
                                                title="Descartar alerta"
                                                onClick={() => descartar(a.idOriginal)}
                                                className="text-muted-foreground hover:text-foreground p-0.5"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <p className="font-semibold text-foreground text-[14px] leading-tight mb-1.5">{a.titulo}</p>

                                    <div className="flex gap-1 mb-1.5">
                                        <span className={'text-[11px] font-semibold px-2 py-0.5 rounded-full ' + COLOR_BADGE[a.severidad]}>
                                            {TEXTO_SEVERIDAD[a.severidad]}
                                        </span>
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/70 text-muted-foreground">
                                            {TEXTO_TIPO[a.tipo]}
                                        </span>
                                    </div>

                                    <p className="text-[12px] text-muted-foreground">{a.descripcion}</p>
                                    {a.fecha && <p className="text-[11px] text-muted-foreground mt-1">{a.fecha}</p>}
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