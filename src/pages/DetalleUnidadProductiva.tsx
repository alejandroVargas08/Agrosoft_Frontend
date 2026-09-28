import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, AlertTriangle, Wheat, User, Clock } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, PageHeader, StatusBadge, Tab } from '../components/ui/AgroUI';
import { useUnidadProductiva } from '../hooks/useUnidadProductiva';
import type { HistorialCultivo } from '../types/produccion';

const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
const fmtFecha = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const DetalleUnidadProductiva = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [tab, setTab] = useState('General');

    const { unidad, historial, ubicacion, cargando, error } = useUnidadProductiva(Number(id));

    if (cargando) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto"><p className="text-sm text-muted-foreground">Cargando unidad...</p></div>
            </DashboardLayout>
        );
    }

    if (error || !unidad) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto">
                    <PageHeader title="Unidad productiva" onBack={() => navigate('/unidades-productivas')} />
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                        {error ?? 'No se encontró la unidad'}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title={unidad.nombreCultivo}
                    subtitle={unidad.tipoCultivo}
                    onBack={() => navigate('/unidades-productivas')}
                    action={<Btn variant="outline" size="sm"><Edit2 size={14} />Editar</Btn>}
                />

                <Tab tabs={['General', 'Incidencias', 'Cosechas', 'Historial']} active={tab} onChange={setTab} />

                {tab === 'General' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                            <h3 className="font-semibold text-foreground mb-3">Información general</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Estado</span><StatusBadge status={unidad.estado} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tipo</span>
                                    <span className="font-medium">{unidad.tipoCultivo}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Área</span>
                                    <span className="font-medium">{ubicacion.areaM2 !== undefined ? `${fmt(ubicacion.areaM2)} m²` : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lote</span>
                                    <span className="font-medium">{ubicacion.nombre}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Inicio</span>
                                    <span className="font-medium">{fmtFecha(unidad.fechaSiembra)}</span>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <h3 className="font-semibold text-foreground mb-3">Resumen</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground">Incidencias activas</span>
                                    <span className="font-bold text-red-500">0</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground">Total cosechas</span>
                                    <span className="font-bold text-primary">0</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground">Costo total</span>
                                    <span className="font-bold text-primary">{fmt(unidad.costoTotal)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {tab === 'Incidencias' && (
                    <EmptyState icon={AlertTriangle} title="Sin incidencias" description="No hay incidencias registradas" />
                )}

                {tab === 'Cosechas' && (
                    <EmptyState icon={Wheat} title="Sin cosechas" description="No hay cosechas registradas" />
                )}

                {tab === 'Historial' && (
                    <div className="space-y-3">
                        {historial.length === 0
                            ? <EmptyState icon={Clock} title="Sin cambios" description="No hay historial de cambios" />
                            : historial.map((h) => <TarjetaHistorial key={h.id} registro={h} />)}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

// Una entrada del historial de cambios
function TarjetaHistorial({ registro }: { registro: HistorialCultivo }) {
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User size={14} className="text-primary" />
                </div>
                <div className="w-0.5 bg-border flex-1 mt-1" />
            </div>
            <Card className="flex-1 mb-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">Usuario #{registro.usuarioId}</span>
                </div>
                <p className="text-xs text-muted-foreground">{registro.motivo}</p>
                <div className="mt-2 p-2 bg-muted rounded-lg text-xs space-y-1">
                    {Object.entries(registro.cambios ?? {}).map(([campo, valor]) => (
                        <div key={campo}>
                            <span className="font-medium">{campo}:</span>{' '}
                            <span className="text-emerald-600">{JSON.stringify(valor)}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

export default DetalleUnidadProductiva;