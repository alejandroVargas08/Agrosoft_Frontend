import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, BookOpen, Bug, CheckCircle, Leaf } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, PageHeader, SearchBar } from '../components/ui/AgroUI';
import { FILTROS, useWikiEpa } from '../hooks/useWikiEpa';
import type { Epa, TipoEpa } from '../types/wikiEpa';

const ICONO: Record<TipoEpa, typeof Bug> = {
    ENFERMEDAD: Bug,
    PLAGA: AlertTriangle,
    ARVENSE: Leaf,
};

const COLOR_ICONO: Record<TipoEpa, string> = {
    ENFERMEDAD: 'bg-red-100 text-red-700',
    PLAGA: 'bg-[#FFF3E0] text-[#F16C07]',
    ARVENSE: 'bg-primary/10 text-primary',
};

const COLOR_BADGE: Record<TipoEpa, 'danger' | 'warning' | 'success'> = {
    ENFERMEDAD: 'danger',
    PLAGA: 'warning',
    ARVENSE: 'success',
};

const ETIQUETA_TIPO: Record<TipoEpa, string> = {
    ENFERMEDAD: 'Enfermedad',
    PLAGA: 'Plaga',
    ARVENSE: 'Arvense',
};

const INICIALES_MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const WikiEpa = () => {
    const navigate = useNavigate();
    const { entradas, busqueda, setBusqueda, filtro, setFiltro, cargando, error } = useWikiEpa();
    const [seleccionada, setSeleccionada] = useState<Epa | null>(null);

    // ─── Detalle ──────────────────────────────────────────────────────────────
    if (seleccionada) {
        const Icono = ICONO[seleccionada.tipoEpa];
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <PageHeader
                        title={seleccionada.nombre}
                        subtitle={ETIQUETA_TIPO[seleccionada.tipoEpa]}
                        onBack={() => setSeleccionada(null)}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 space-y-4 min-w-0">
                            <Card>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={'p-2 rounded-lg ' + COLOR_ICONO[seleccionada.tipoEpa]}>
                                        <Icono size={18} />
                                    </div>
                                    <Badge color={COLOR_BADGE[seleccionada.tipoEpa]}>
                                        {ETIQUETA_TIPO[seleccionada.tipoEpa]}
                                    </Badge>
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">Descripción</h3>
                                <p className="text-sm text-foreground whitespace-pre-line">{seleccionada.descripcion}</p>
                            </Card>

                            <Card>
                                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-[#F16C07]" />
                                    Síntomas
                                </h3>
                                <p className="text-sm text-foreground whitespace-pre-line">{seleccionada.sintomas}</p>
                            </Card>

                            <Card>
                                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-500" />
                                    Manejo y control
                                </h3>
                                <p className="text-sm text-foreground whitespace-pre-line">{seleccionada.manejoYControl}</p>
                            </Card>
                        </div>

                        <div className="space-y-4 min-w-0">
                            <Card>
                                <h3 className="font-semibold text-foreground mb-3">Estacionalidad</h3>
                                <div className="grid grid-cols-6 gap-1">
                                    {INICIALES_MESES.map((inicial, i) => {
                                        const activo = seleccionada.mesesProbables.includes(i + 1);
                                        return (
                                            <div
                                                key={i}
                                                title={'Mes ' + (i + 1)}
                                                className={
                                                    'aspect-square flex items-center justify-center text-xs font-medium rounded-md ' +
                                                    (activo ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')
                                                }
                                            >
                                                {inicial}
                                            </div>
                                        );
                                    })}
                                </div>

                                {seleccionada.temporadas.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {seleccionada.temporadas.map((temporada) => (
                                            <Badge key={temporada} color="info">{temporada}</Badge>
                                        ))}
                                    </div>
                                )}

                                {seleccionada.notasEstacionalidad && (
                                    <p className="mt-3 text-xs text-muted-foreground">{seleccionada.notasEstacionalidad}</p>
                                )}
                            </Card>

                            {seleccionada.etiquetas.length > 0 && (
                                <Card>
                                    <h3 className="font-semibold text-foreground mb-2">Etiquetas</h3>
                                    <div className="flex flex-wrap gap-1">
                                        {seleccionada.etiquetas.map((etiqueta) => (
                                            <span
                                                key={etiqueta}
                                                className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full"
                                            >
                                                #{etiqueta}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            <Btn variant="outline" onClick={() => navigate('/incidencias')} className="w-full justify-center">
                                <AlertTriangle size={16} />
                                Reportar como incidencia
                            </Btn>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // ─── Listado ──────────────────────────────────────────────────────────────
    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader title="Wiki EPA" subtitle="Enciclopedia de Enfermedades, Plagas y Arvenses" />

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                        {error}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar en la wiki..." />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {FILTROS.map((opcion) => (
                            <button
                                key={opcion}
                                type="button"
                                onClick={() => setFiltro(opcion)}
                                className={
                                    'px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ' +
                                    (filtro === opcion ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')
                                }
                            >
                                {opcion}
                            </button>
                        ))}
                    </div>
                </div>

                {cargando && <p className="text-sm text-muted-foreground">Cargando la wiki...</p>}

                {!cargando && !error && entradas.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title="Sin resultados"
                        description="No hay entradas que coincidan con la búsqueda o el filtro."
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {entradas.map((epa) => {
                            const Icono = ICONO[epa.tipoEpa];
                            return (
                                <Card key={epa.id} onClick={() => setSeleccionada(epa)}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={'p-2 rounded-lg ' + COLOR_ICONO[epa.tipoEpa]}>
                                            <Icono size={18} />
                                        </div>
                                        <Badge color={COLOR_BADGE[epa.tipoEpa]}>{ETIQUETA_TIPO[epa.tipoEpa]}</Badge>
                                    </div>

                                    <h3 className="font-semibold text-foreground mb-1">{epa.nombre}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{epa.sintomas}</p>

                                    <div className="flex flex-wrap gap-1">
                                        {epa.etiquetas.slice(0, 3).map((etiqueta) => (
                                            <span
                                                key={etiqueta}
                                                className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full"
                                            >
                                                #{etiqueta}
                                            </span>
                                        ))}
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

export default WikiEpa;
