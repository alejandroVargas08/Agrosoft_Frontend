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
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {unidades.map((u) => {
                            const ubicacion = ubicacionDe(u);
                            return (
                                <Card
                                    key={u.id}
                                    className="p-3"
                                    onClick={() => navigate(`/unidades-productivas/${u.id}`)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="p-1.5 bg-primary/10 rounded-lg">
                                            <Sprout size={16} className="text-primary" />
                                        </div>
                                        <StatusBadge status={u.estado} />
                                    </div>

                                    <p className="font-semibold text-[14px] text-foreground mb-0.5 leading-tight">
                                        {u.nombreCultivo}
                                    </p>
                                    <p className="text-[12px] text-muted-foreground mb-1.5">{u.tipoCultivo}</p>

                                    <div className="flex flex-col gap-0.5 text-[12px] text-muted-foreground">
                                        <span className="flex items-center gap-1 truncate">
                                            <MapPin size={10} />{ubicacion.nombre}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Scale size={10} />
                                            {ubicacion.areaM2 !== undefined ? `${fmt(ubicacion.areaM2)} m²` : 'Área no registrada'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={10} />Inicio: {fmtFecha(u.fechaSiembra)}
                                        </span>
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