import { useNavigate } from 'react-router-dom';
import { Plus, Sprout, MapPin, Scale, Calendar } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, PageHeader, SearchBar, Select, StatusBadge } from '../components/ui/AgroUI';
import { useUnidadesProductivas } from '../hooks/useUnidadesProductivas';
import type { EstadoCultivo } from '../types/produccion';

const FILTROS = [
    { value: 'Todos', label: 'Todos' },
    { value: 'activo', label: 'Activo' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'cancelado', label: 'Cancelado' },
];

const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const UnidadesProductivas = () => {
    const navigate = useNavigate();
    const {
        unidades, totalUnidades, cargando, error,
        busqueda, setBusqueda, filtroEstado, setFiltroEstado, ubicacionDe,
    } = useUnidadesProductivas();

    const botonNueva = (
        <Btn onClick={() => navigate('/unidades-productivas/nueva')}><Plus size={16} />Nueva Unidad</Btn>
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Unidades Productivas"
                    subtitle={`${totalUnidades} unidades registradas`}
                    action={botonNueva}
                />

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1">
                        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar unidades..." />
                    </div>
                    <Select
                        value={filtroEstado}
                        onChange={(v) => setFiltroEstado(v as 'Todos' | EstadoCultivo)}
                        options={FILTROS}
                        className="sm:w-44"
                    />
                </div>

                {cargando && <p className="text-sm text-muted-foreground">Cargando unidades...</p>}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
                )}

                {!cargando && !error && unidades.length === 0 ? (
                    <EmptyState
                        icon={Sprout}
                        title="Sin unidades"
                        description={busqueda || filtroEstado !== 'Todos'
                            ? 'Ninguna unidad coincide con la búsqueda'
                            : 'Registra tu primera unidad productiva'}
                        action={botonNueva}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unidades.map((u) => {
                            const ubicacion = ubicacionDe(u);
                            return (
                                <Card key={u.id}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-primary/10 rounded-lg"><Sprout size={20} className="text-primary" /></div>
                                        <StatusBadge status={u.estado} />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1">{u.nombreCultivo}</h3>
                                    <p className="text-sm text-primary mb-2">{u.tipoCultivo}</p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 truncate"><MapPin size={12} />{ubicacion.nombre}</span>
                                        {ubicacion.areaM2 !== undefined && (
                                            <span className="flex items-center gap-1"><Scale size={12} />{fmt(ubicacion.areaM2)} m²</span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar size={12} />Inicio: {fmtFecha(u.fechaSiembra)}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default UnidadesProductivas;