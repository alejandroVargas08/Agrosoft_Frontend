import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Pencil, RotateCcw, Save } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, Input, PageHeader } from '../../components/ui/AgroUI';
import { MapaSatelital } from '../../components/mapa/MapaSatelital';
import { AjustarVista, Poligono, PoligonoEditable } from '../../components/mapa/FigurasMapa';
import { useTerritorio } from '../../hooks/useTerritorio';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { lotesApi, sublotesApi } from '../../api/territorio';
import { mensajeError } from '../../api/errores/errores';
import { areaPoligonoM2, centroide } from '../../utils/geo/geo';
import type { Punto } from '../../types/territorio';

const COLOR_EDITANDO = '#facc15';

const fmt = (n: number, decimales = 2) => n.toLocaleString('es-CO', { maximumFractionDigits: decimales });

const EditarTerreno = () => {
    const { tipo, id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { puede, cargando } = usePermisos();
    const { lotes, sublotes, loading } = useTerritorio();

    const esSublote = tipo === 'sublote';
    const objetivoId = Number(id);
    const objetivo = esSublote ? sublotes.find((s) => s.id === objetivoId) : lotes.find((l) => l.id === objetivoId);
    const loteId = esSublote ? sublotes.find((s) => s.id === objetivoId)?.loteId : objetivoId;
    const lotePadre = lotes.find((l) => l.id === loteId);
    const referencias = esSublote
        ? sublotes.filter((s) => s.loteId === loteId && s.id !== objetivoId)
        : sublotes.filter((s) => s.loteId === objetivoId);

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [vertices, setVertices] = useState<Punto[]>([]);
    const [version, setVersion] = useState(0);
    const [cargado, setCargado] = useState(false);

    useEffect(() => {
        if (!objetivo || cargado) return;
        setNombre(objetivo.nombre);
        setDescripcion(objetivo.descripcion ?? '');
        setVertices(objetivo.vertices);
        setCargado(true);
    }, [objetivo, cargado]);

    const areaM2 = vertices.length >= 3 ? areaPoligonoM2(vertices) : 0;
    const cambioForma = !!objetivo && JSON.stringify(vertices) !== JSON.stringify(objetivo.vertices);

    const deshacer = () => {
        if (!objetivo) return;
        setVertices(objetivo.vertices);
        setVersion((v) => v + 1);
    };

    const guardar = useMutation({
        mutationFn: async () => {
            if (!objetivo) throw new Error('No se encontró el terreno');
            if (!nombre.trim()) throw new Error('El nombre no puede quedar vacío');
            if (vertices.length < 3) throw new Error('El polígono necesita al menos 3 puntos');
            const datos = {
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                ...(cambioForma ? { vertices, centroide: centroide(vertices), areaM2: Math.round(areaM2) } : {}),
            };
            return esSublote ? (await sublotesApi.actualizar(objetivoId, datos)).data : (await lotesApi.actualizar(objetivoId, datos)).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lotes'] });
            if (loteId) queryClient.invalidateQueries({ queryKey: ['sublotes', loteId] });
            navigate('/territorio');
        },
    });

    if (!cargando && !puede('lotes.gestionar')) return <Navigate to="/territorio" replace />;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
                <PageHeader
                    title={esSublote ? 'Editar sublote' : 'Editar lote'}
                    subtitle={objetivo ? (esSublote && lotePadre ? `${lotePadre.nombre} / ${objetivo.nombre}` : objetivo.nombre) : 'Cargando...'}
                    onBack={() => navigate('/territorio')}
                />

                {!loading && !objetivo && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        No se encontró ese {esSublote ? 'sublote' : 'lote'} o no tienes acceso a él.
                    </div>
                )}

                {objetivo && cargado && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <Card className="lg:col-span-3 p-0 overflow-hidden flex flex-col">
                            <div className="p-3 bg-muted text-[13px] font-semibold flex items-center gap-2">
                                <Pencil size={13} className="text-primary" />
                                Mueve las esquinas para cuadrar el {esSublote ? 'sublote' : 'lote'}
                            </div>
                            <MapaSatelital className="flex-1 min-h-120">
                                <AjustarVista puntos={[...objetivo.vertices, ...(esSublote && lotePadre ? lotePadre.vertices : [])]} />
                                {esSublote && lotePadre && <Poligono vertices={lotePadre.vertices} color="#ffffff" opacidad={0.05} grosor={2} />}
                                {referencias.filter((r) => r.vertices.length >= 3).map((r) => (
                                    <Poligono key={r.id} vertices={r.vertices} color="#93c5fd" opacidad={0.15} grosor={1} />
                                ))}
                                <PoligonoEditable key={version} vertices={vertices} color={COLOR_EDITANDO} onChange={setVertices} />
                            </MapaSatelital>
                            <div className="px-3 py-2 text-[11px] text-muted-foreground space-y-0.5">
                                <p>• Arrastra los puntos blancos grandes para mover una esquina.</p>
                                <p>• Arrastra los puntos pequeños del medio de cada borde para agregar una esquina nueva.</p>
                                <p>• Haz clic derecho sobre una esquina para borrarla (mínimo 3).</p>
                                {esSublote && <p>• La línea blanca es el borde del lote y las azules son los otros sublotes.</p>}
                            </div>
                        </Card>

                        <Card className="lg:col-span-2 space-y-4 h-fit">
                            <Input label="Nombre" value={nombre} onChange={setNombre} required />
                            <Input label="Descripción" value={descripcion} onChange={setDescripcion} placeholder="Descripción breve" />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[11px] text-muted-foreground">Área</p>
                                    <p className="text-sm font-semibold">{fmt(areaM2 / 10_000)} ha</p>
                                    <p className="text-[11px] text-muted-foreground">{fmt(areaM2, 0)} m²</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground">Esquinas</p>
                                    <p className="text-sm font-semibold">{vertices.length}</p>
                                    {cambioForma && <p className="text-[11px] text-amber-700">Antes: {fmt(objetivo.areaHa)} ha</p>}
                                </div>
                            </div>

                            {guardar.error && (
                                <p className="text-xs text-red-700">{mensajeError(guardar.error, 'No se pudieron guardar los cambios')}</p>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <Btn onClick={() => guardar.mutate()} disabled={guardar.isPending}>
                                    <Save size={16} />
                                    {guardar.isPending ? 'Guardando...' : 'Guardar cambios'}
                                </Btn>
                                <Btn variant="ghost" onClick={deshacer} disabled={!cambioForma || guardar.isPending}>
                                    <RotateCcw size={16} />Deshacer forma
                                </Btn>
                                <Btn variant="ghost" onClick={() => navigate('/territorio')}>Cancelar</Btn>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default EditarTerreno;
