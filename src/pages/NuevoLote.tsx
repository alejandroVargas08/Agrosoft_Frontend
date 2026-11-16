import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { Info, Trash2, Undo2 } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, Input, PageHeader, Select } from '../components/ui/AgroUI';
import { MapaSatelital } from '../components/mapa/MapaSatelital';
import { AjustarVista, Circulo, Lineas, Poligono } from '../components/mapa/FigurasMapa';
import { lotesApi } from '../api/territorio';
import { etiquetaPrograma, programasFormacionApi } from '../api/programa_formacion/programasFormacion';
import { useNuevoLoteForm } from '../hooks/useNuevoLoteForm';
import { usePermisos } from '../hooks/permisos/usePermisos';

const COLOR_NUEVO = '#f59e0b';
const COLOR_PADRE = '#2d7a3e';

const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });

const NuevoLote = () => {
    const navigate = useNavigate();
    const volver = () => navigate('/territorio');

    const { data: lotes = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
    });

    const { data: programas = [] } = useQuery({
        queryKey: ['mi-acceso', 'programas'],
        queryFn: async () => (await programasFormacionApi.listarAsignables()).data,
    });

    const {
        form, set, vertices, agregarVertice, deshacerVertice, limpiarVertices,
        areaM2, areaHa, enviando, errorForm, handleSubmit,
    } = useNuevoLoteForm({ onSuccess: volver });

    const lotePadre = form.tipo === 'subplot' ? lotes.find((l) => String(l.id) === form.parentId) : undefined;

    const { puede, cargando } = usePermisos();

    if (!cargando && !puede('lotes.gestionar')) {
        return <Navigate to="/territorio" replace />;
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                <PageHeader title={form.tipo === 'subplot' ? 'Nuevo Sublote' : 'Nuevo Lote'} onBack={volver} />
                <form className="grid grid-cols-1 lg:grid-cols-5 gap-4" onSubmit={handleSubmit}>
                    <Card className="lg:col-span-2 space-y-4">
                        {errorForm && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
                        )}

                        <Select
                            label="Tipo" value={form.tipo} onChange={set('tipo')}
                            options={[{ value: 'plot', label: 'Lote principal' }, { value: 'subplot', label: 'Sublote' }]}
                        />
                        {form.tipo === 'subplot' && (
                            <Select
                                label="Lote padre" value={form.parentId} onChange={set('parentId')}
                                options={[{ value: '', label: 'Seleccionar...' }, ...lotes.map((l) => ({ value: String(l.id), label: l.nombre }))]}
                            />
                        )}
                        {form.tipo === 'plot' && (
                            <div className="flex flex-col gap-1">
                                <Select
                                    label="Ficha a cargo" value={form.programaFormacionId} onChange={set('programaFormacionId')}
                                    options={[
                                        { value: '', label: 'Común (lo ven todos)' },
                                        ...programas.map((p) => ({ value: String(p.id), label: etiquetaPrograma(p) })),
                                    ]}
                                />
                                <span className="text-xs text-muted-foreground">
                                    Si eliges una ficha, solo la verán sus aprendices, sus instructores y el administrador.
                                </span>
                            </div>
                        )}
                        {form.tipo === 'subplot' && (
                            <span className="text-xs text-muted-foreground">El sublote tiene la misma visibilidad que su lote padre.</span>
                        )}
                        <Input label="Nombre" value={form.nombre} onChange={set('nombre')} required placeholder="Ej: Lote C - Oriente" />
                        <Input label="Descripción" value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción breve" />

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold">Área (ha)</label>
                                <div className="px-3 py-2 rounded-lg border border-border bg-muted text-sm">{areaM2 ? fmt(areaHa) : '—'}</div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold">Área (m²)</label>
                                <div className="px-3 py-2 rounded-lg border border-border bg-muted text-sm">{areaM2 ? fmt(areaM2) : '—'}</div>
                            </div>
                        </div>

                        <div className="p-3 bg-[#FFF3E0] border border-[#F16C07]/30 rounded-lg text-xs text-[#E65100] flex gap-2">
                            <Info size={14} className="shrink-0 mt-0.5" />
                            <span>
                                Haz clic en el mapa sobre cada esquina del terreno, en orden (mínimo 3).
                                El área y el centroide se calculan automáticamente.
                            </span>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Btn type="submit" disabled={enviando} className="flex-1 justify-center">
                                {enviando ? 'Guardando...' : form.tipo === 'subplot' ? 'Guardar Sublote' : 'Guardar Lote'}
                            </Btn>
                            <Btn variant="outline" onClick={volver}>Cancelar</Btn>
                        </div>
                    </Card>

                    <Card className="lg:col-span-3 p-0 overflow-hidden flex flex-col">
                        <div className="p-3 bg-muted text-[13px] font-semibold flex items-center gap-2">
                            <span>Esquinas marcadas: {vertices.length}</span>
                            <div className="ml-auto flex gap-2">
                                <Btn size="sm" variant="outline" onClick={deshacerVertice} disabled={vertices.length === 0}>
                                    <Undo2 size={14} />Deshacer
                                </Btn>
                                <Btn size="sm" variant="outline" onClick={limpiarVertices} disabled={vertices.length === 0}>
                                    <Trash2 size={14} />Limpiar
                                </Btn>
                            </div>
                        </div>
                        <MapaSatelital className="flex-1 min-h-120" onClickMapa={agregarVertice}>
                            {lotePadre && <Poligono vertices={lotePadre.vertices} color={COLOR_PADRE} opacidad={0.15} zIndex={1} onClick={agregarVertice} />}
                            {lotePadre && vertices.length === 0 && <AjustarVista puntos={lotePadre.vertices} />}
                            {vertices.length >= 3 && <Poligono vertices={vertices} color={COLOR_NUEVO} opacidad={0.3} zIndex={2} onClick={agregarVertice} />}
                            {vertices.length === 2 && <Lineas lineas={[vertices]} color={COLOR_NUEVO} grosor={2} />}
                            {vertices.map((v, i) => (
                                <Circulo key={i} centro={v} radioM={1.5} color={COLOR_NUEVO} opacidad={1} />
                            ))}
                        </MapaSatelital>
                    </Card>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default NuevoLote;
