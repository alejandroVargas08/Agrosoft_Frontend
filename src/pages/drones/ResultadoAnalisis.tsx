import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, BarChart3, Bot, CheckCircle, ChevronLeft, ClipboardList, Download, Info, Layers, MapPin, Sparkles, Sprout } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, PageHeader } from '../../components/ui/AgroUI';
import { BarraDistribucion, ImagenCaptura } from '../../components/drones/ComponentesDron';
import { MapaVuelo } from '../../components/drones/MapaVuelo';
import { analisisApi, dronesApi, vuelosApi } from '../../api/drones/drones';
import { lotesApi } from '../../api/territorio';
import { disenoTerrenoApi } from '../../api/disenoTerreno/disenoTerreno';
import { sublotesApi } from '../../api/territorio';
import { areaPoligonoM2, centroide } from '../../utils/geo/geo';
import type { SubLote } from '../../types/territorio';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { PERMISOS_TERRENO } from '../../types/disenoTerreno/disenoTerreno';
import { mensajeError } from '../../api/errores/errores';
import { CAPAS, CLASE_VEGETACION, LEYENDA_CAPA, NIVEL_CLASES, NIVEL_TEXTO, TIPO_HALLAZGO, type CapaMapa, type ClaseVegetacion, PERMISOS_DRONES, type ResultadoCaptura } from '../../types/drones/drones';
import { fechaCortaDron, fechaHoraDron } from '../../utils/drones/drones';

const ALTURA_VUELO_POR_DEFECTO_M = 60;
const FACTOR_HUELLA_CAMARA = 0.55;

const ORDEN_CLASES: ClaseVegetacion[] = ['SALUDABLE', 'ESTRES_MODERADO', 'ESTRES_ALTO', 'SIN_VEGETACION'];

const INDICES: { clave: 'ndvi' | 'ndre' | 'gndvi' | 'ndwi'; nombre: string; descripcion: string }[] = [
    { clave: 'ndvi', nombre: 'NDVI', descripcion: 'Vigor general' },
    { clave: 'ndre', nombre: 'NDRE', descripcion: 'Clorofila / nitrógeno' },
    { clave: 'gndvi', nombre: 'GNDVI', descripcion: 'Actividad fotosintética' },
    { clave: 'ndwi', nombre: 'NDWI', descripcion: 'Agua en la planta' },
];

const Leyenda = ({ capa }: { capa: CapaMapa }) => {
    if (capa === 'RGB') return null;
    if (capa === 'CLASIFICACION') {
        return (
            <div className="flex flex-wrap gap-3 text-xs">
                {ORDEN_CLASES.map((c) => (
                    <span key={c} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CLASE_VEGETACION[c].color }} />
                        {CLASE_VEGETACION[c].texto}
                    </span>
                ))}
            </div>
        );
    }
    const leyenda = LEYENDA_CAPA[capa];
    return (
        <div className="space-y-1">
            <div className="h-2.5 rounded-full" style={{ background: `linear-gradient(to right, ${leyenda.colores.join(', ')})` }} />
            <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{leyenda.bajo} ({leyenda.minimo})</span>
                <span>{leyenda.alto} ({leyenda.maximo})</span>
            </div>
        </div>
    );
};

const ResultadoAnalisis = () => {
    const { id } = useParams();
    const analisisId = Number(id);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [capa, setCapa] = useState<CapaMapa>('NDVI');
    const [soloCriticas, setSoloCriticas] = useState(false);
    const [seleccion, setSeleccion] = useState<number | null>(null);
    const [params] = useSearchParams();
    const imprimir = params.get('imprimir') === '1';

    const analisis = useQuery({
        queryKey: ['analisis', analisisId],
        queryFn: async () => (await analisisApi.obtener(analisisId)).data,
        enabled: Number.isFinite(analisisId),
        refetchInterval: (query) => (query.state.data && ['PENDIENTE', 'PROCESANDO'].includes(query.state.data.estado) ? 3000 : false),
    });

    const datos = analisis.data;

    const vuelo = useQuery({
        queryKey: ['vuelo', datos?.vueloId],
        queryFn: async () => (await vuelosApi.obtener(datos!.vueloId)).data,
        enabled: !!datos,
    });

    const capturas = useQuery({
        queryKey: ['vuelo', datos?.vueloId, 'capturas'],
        queryFn: async () => (await vuelosApi.capturas(datos!.vueloId)).data,
        enabled: !!datos,
    });

    const resultados = useQuery({
        queryKey: ['analisis', analisisId, 'resultados'],
        queryFn: async () => (await analisisApi.resultados(analisisId)).data,
        enabled: datos?.estado === 'COMPLETADO',
    });

    const drones = useQuery({ queryKey: ['drones'], queryFn: async () => (await dronesApi.listar()).data });
    const lotes = useQuery({ queryKey: ['lotes'], queryFn: async () => (await lotesApi.listar()).data });

    const { puede } = usePermisos();
    const puedeDisenar = puede(PERMISOS_TERRENO.EVALUAR);
    // Igual que en el Figma: quien no puede pedir análisis (el aprendiz) reporta una novedad en vez de crear incidencias
    const esAprendiz = !puede(PERMISOS_DRONES.SOLICITAR_ANALISIS);

    const disenar = useMutation({
        mutationFn: async () => {
            const v = vuelo.data;
            if (!v) throw new Error('El vuelo aún no carga');
            const evaluacion = (await disenoTerrenoApi.solicitar({ loteId: v.loteId, vueloId: v.id, soloAreaVuelo: true, usarDron: true })).data;
            if (puede('lotes.gestionar')) {
                const nombre = `Vuelo ${v.nombre}`.slice(0, 100);
                const existentes: SubLote[] = await sublotesApi.porLote(v.loteId).then((r) => r.data).catch(() => []);
                if (!existentes.some((s) => s.nombre === nombre)) {
                    await sublotesApi
                        .crear({
                            loteId: v.loteId,
                            nombre,
                            vertices: evaluacion.poligono,
                            centroide: centroide(evaluacion.poligono),
                            areaM2: Math.round(areaPoligonoM2(evaluacion.poligono)),
                            descripcion: `Área sobrevolada por el dron el ${fechaCortaDron(v.fechaVuelo)} (vuelo #${v.id})`,
                        })
                        .catch(() => null);
                }
            }
            return evaluacion;
        },
        onSuccess: (evaluacion) => {
            if (evaluacion.loteId) queryClient.invalidateQueries({ queryKey: ['sublotes', evaluacion.loteId] });
            navigate(`/territorio/evaluacion/${evaluacion.id}`);
        },
    });

    const numeroCaptura = useMemo(() => new Map((capturas.data ?? []).map((c) => [c.id, c.numeroCaptura])), [capturas.data]);

    const lista = useMemo(
        () =>
            [...(resultados.data ?? [])]
                .filter((r) => !soloCriticas || r.esCritica)
                .sort((a, b) => (numeroCaptura.get(a.capturaId) ?? a.capturaId) - (numeroCaptura.get(b.capturaId) ?? b.capturaId)),
        [resultados.data, soloCriticas, numeroCaptura],
    );

    useEffect(() => {
        if (lista.length > 0 && !lista.some((r) => r.id === seleccion)) setSeleccion(lista[0].id);
    }, [lista, seleccion]);

    const actual: ResultadoCaptura | undefined = lista.find((r) => r.id === seleccion);

    // "Descargar PDF": el navegador imprime la página y permite guardarla como PDF
    const listoParaImprimir = analisis.data?.estado === 'COMPLETADO' && !!vuelo.data && !resultados.isLoading;
    useEffect(() => {
        if (!imprimir || !listoParaImprimir) return;
        const t = setTimeout(() => window.print(), 800);
        return () => clearTimeout(t);
    }, [imprimir, listoParaImprimir]);

    if (analisis.isLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-6xl mx-auto p-6 space-y-4">
                    <div className="h-10 w-72 rounded-lg bg-muted animate-pulse" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
                    <div className="h-96 rounded-xl bg-muted animate-pulse" />
                </div>
            </DashboardLayout>
        );
    }

    if (analisis.error || !datos) {
        return (
            <DashboardLayout>
                <div className="max-w-6xl mx-auto p-6">
                    <EmptyState
                        icon={BarChart3}
                        title="No se pudo abrir el análisis"
                        description={mensajeError(analisis.error, 'El análisis no existe o no tienes acceso a él.')}
                        action={<Btn onClick={() => navigate('/drones/vuelos')}>Volver a vuelos</Btn>}
                    />
                </div>
            </DashboardLayout>
        );
    }

    const volver = () => navigate(`/drones/vuelos/${datos.vueloId}?tab=analisis`);

    if (datos.estado !== 'COMPLETADO' || !datos.resumen) {
        return (
            <DashboardLayout>
                <div className="max-w-3xl mx-auto p-6">
                    <PageHeader title={`Análisis #${datos.id}`} subtitle={vuelo.data?.nombre} onBack={volver} />
                    {datos.estado === 'ERROR' ? (
                        <EmptyState icon={AlertTriangle} title="El análisis falló" description={datos.mensajeError ?? 'Ocurrió un error inesperado.'} action={<Btn onClick={volver}>Volver al vuelo</Btn>} />
                    ) : (
                        <Card>
                            <p className="font-semibold text-foreground mb-2">Analizando… {datos.progreso}%</p>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-amber-500 transition-all" style={{ width: `${datos.progreso}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Esta página se actualizará sola cuando termine.</p>
                        </Card>
                    )}
                </div>
            </DashboardLayout>
        );
    }

    const resumen = datos.resumen;
    const ia = resumen.ia ?? { estado: 'DESACTIVADO' as const, capturasInterpretadas: 0, capturasConError: 0, sintesis: null, mensaje: null };
    const sintesis = ia.sintesis;
    const infoCapa = CAPAS.find((c) => c.valor === capa)!;
    const dron = drones.data?.find((d) => d.id === vuelo.data?.dronId);
    const lote = lotes.data?.find((l) => l.id === vuelo.data?.loteId);

    const saludData = ORDEN_CLASES.map((c) => ({ name: CLASE_VEGETACION[c].texto, value: Number(resumen.distribucionNdvi[c].toFixed(1)), color: CLASE_VEGETACION[c].color }));

    const indices = [
        { label: 'NDVI promedio', dato: resumen.ndvi?.promedio ?? null, color: '#2D7A3E', tip: 'Vigor general de la vegetación' },
        { label: 'NDRE promedio', dato: resumen.ndre?.promedio ?? null, color: '#3A9C50', tip: 'Clorofila / nitrógeno foliar' },
        { label: 'GNDVI promedio', dato: resumen.gndvi?.promedio ?? null, color: '#4A8C5C', tip: 'Actividad fotosintética' },
        { label: 'NDWI promedio', dato: resumen.ndwi?.promedio ?? null, color: '#2563EB', tip: 'Agua en la planta' },
    ];

    const borde = (r: ResultadoCaptura) =>
        r.esCritica ? 'border-red-400' : r.clasificacion === 'ESTRES_MODERADO' || r.clasificacion === 'ESTRES_ALTO' ? 'border-[#F16C07]/60' : 'border-border';

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Análisis de Vuelo"
                    subtitle={`${vuelo.data?.nombre ?? `Vuelo #${datos.vueloId}`} · ${lote?.nombre ?? '—'}`}
                    onBack={volver}
                    action={
                        <div className="flex flex-wrap gap-2 print:hidden">
                            <Btn variant="outline" size="sm" onClick={() => window.print()}><Download size={14} />PDF</Btn>
                            {puedeDisenar && vuelo.data && (
                                <Btn size="sm" onClick={() => disenar.mutate()} disabled={disenar.isPending}>
                                    <Sprout size={14} />
                                    {disenar.isPending ? 'Enviando...' : 'Diseñar terreno'}
                                </Btn>
                            )}
                        </div>
                    }
                />
                <p className="text-xs text-muted-foreground -mt-3 mb-4">
                    Vuelo del {fechaCortaDron(vuelo.data?.fechaVuelo)} · analizado {fechaHoraDron(datos.finalizadoEn)} · umbrales NDVI: sin vegetación &lt; {datos.umbrales.sinVegetacion}, estrés &lt; {datos.umbrales.estresAlto}, saludable ≥ {datos.umbrales.saludable}
                </p>

                {disenar.error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {mensajeError(disenar.error, 'No se pudo iniciar el diseño del terreno')}
                    </div>
                )}

                {/* Capa de visualización sobre la captura elegida */}
                <Card className="mb-4 overflow-hidden p-0">
                    <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                        <Layers size={16} className="text-primary" />
                        <span className="text-sm font-semibold text-foreground">Capa de visualización</span>
                        <div className="flex flex-wrap gap-1 ml-auto">
                            {CAPAS.map((c) => (
                                <button
                                    key={c.valor}
                                    onClick={() => setCapa(c.valor)}
                                    title={c.descripcion}
                                    className={`px-2 py-1 rounded-lg text-xs font-bold uppercase transition-all ${capa === c.valor ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-primary/10'}`}
                                >
                                    {c.valor === 'CLASIFICACION' ? 'Clasificación' : c.valor}
                                </button>
                            ))}
                        </div>
                    </div>
                    {resultados.isLoading && <div className="h-56 bg-muted animate-pulse" />}
                    {resultados.error && (
                        <div className="m-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{mensajeError(resultados.error, 'No se pudieron cargar los resultados por captura')}</div>
                    )}
                    {actual ? (
                        <div className="relative bg-neutral-900">
                            <ImagenCaptura
                                vueloId={datos.vueloId}
                                capturaId={actual.capturaId}
                                capa={capa}
                                banda="RGB"
                                tamano="completa"
                                className="w-full min-h-[224px] max-h-[460px] object-contain"
                                alt={`Captura ${numeroCaptura.get(actual.capturaId) ?? ''} capa ${capa}`}
                            />
                            <div className="absolute top-2 left-2 bg-black/50 rounded-lg px-2 py-1 text-[11px] text-white">
                                Captura {numeroCaptura.get(actual.capturaId) ?? actual.capturaId} · {infoCapa.descripcion}
                            </div>
                            {dron && (
                                <div className="absolute top-2 right-2 bg-black/50 rounded-lg px-2 py-1 text-[10px] text-white font-mono">
                                    {dron.tipoCamara === 'MULTIESPECTRAL' ? 'Multiespectral' : 'RGB'}
                                </div>
                            )}
                        </div>
                    ) : (
                        !resultados.isLoading && <p className="text-sm text-muted-foreground py-10 text-center">No hay resultados por captura.</p>
                    )}
                    {actual && capa !== 'RGB' && <div className="p-3 border-t border-border"><Leyenda capa={capa} /></div>}
                </Card>

                {/* Distribución de salud e índices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Distribución de salud</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-[120px] h-[120px] shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={saludData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={2}>
                                            {saludData.map((d) => <Cell key={d.name} fill={d.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(v) => `${v}%`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-1.5 flex-1">
                                {saludData.map((h) => (
                                    <div key={h.name} className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: h.color }} />
                                        <span className="text-xs text-muted-foreground flex-1">{h.name}</span>
                                        <span className="text-xs font-bold text-foreground">{h.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Índices promedio</h3>
                        <div className="space-y-2">
                            {indices.map((idx) => (
                                <div key={idx.label}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">{idx.label}</span>
                                        <span className="font-bold text-foreground">{idx.dato !== null ? idx.dato.toFixed(2) : '—'}</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, (idx.dato ?? 0) * 100))}%`, background: idx.color }} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{idx.tip}</p>
                                </div>
                            ))}
                            {resumen.cobertura && (
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">Cobertura vegetal</span>
                                        <span className="font-bold text-foreground">{resumen.cobertura.VEGETACION.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div className="h-2 rounded-full transition-all" style={{ width: `${resumen.cobertura.VEGETACION}%`, background: '#569058' }} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Suelo sin vegetación {resumen.cobertura.SIN_VEGETACION.toFixed(0)}% · agua {resumen.cobertura.AGUA.toFixed(0)}%
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Interpretación IA */}
                <Card className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-primary/10 rounded-lg"><Sparkles size={16} className="text-primary" /></div>
                        <h3 className="font-semibold text-foreground">Interpretación IA</h3>
                        <Badge color="primary">AgroBot</Badge>
                        {ia.estado === 'PARCIAL' && <Badge color="warning">Parcial</Badge>}
                    </div>
                    {sintesis ? (
                        <>
                            <p className="text-sm text-muted-foreground mb-3">{sintesis.resumen}</p>
                            <div className="space-y-2">
                                {sintesis.hallazgosPrincipales.map((h, i) => (
                                    <div key={`h${i}`} className="flex items-start gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                                        <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-emerald-800">{h}</p>
                                    </div>
                                ))}
                                {sintesis.advertencias.map((a, i) => (
                                    <div key={`a${i}`} className="flex items-start gap-2 p-2 bg-[#FFF3E0] border border-[#F16C07]/20 rounded-lg">
                                        <AlertTriangle size={14} className="text-[#F16C07] shrink-0 mt-0.5" />
                                        <p className="text-xs text-[#E65100]">{a}</p>
                                    </div>
                                ))}
                                {sintesis.recomendaciones.map((r, i) => (
                                    <div key={`r${i}`} className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                                        <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-800">{r}</p>
                                    </div>
                                ))}
                                {sintesis.zonasCandidatasSiembra && (
                                    <div className="flex items-start gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                                        <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-emerald-800"><span className="font-semibold">Zonas candidatas para siembra: </span>{sintesis.zonasCandidatasSiembra}</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-3">Generado por IA a partir de {ia.capturasInterpretadas} capturas. Verifica en campo antes de tomar decisiones.</p>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {ia.estado === 'DESACTIVADO'
                                ? 'Este análisis se hizo sin interpretación de IA. Puedes volver a analizar el vuelo activándola.'
                                : ia.mensaje ?? 'La IA no generó resultados para este análisis.'}
                        </p>
                    )}
                </Card>

                {/* Capturas procesadas */}
                <Card className="mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-foreground">{resumen.capturasAnalizadas} capturas procesadas</h3>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer print:hidden">
                            <input type="checkbox" checked={soloCriticas} onChange={(e) => setSoloCriticas(e.target.checked)} className="accent-[#2D7A3E]" />
                            Solo críticas
                        </label>
                    </div>
                    {lista.length === 0 && !resultados.isLoading && (
                        <p className="text-sm text-muted-foreground py-6 text-center">{soloCriticas ? 'No hay capturas críticas. ¡Buen estado general!' : 'No hay resultados por captura.'}</p>
                    )}
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {lista.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setSeleccion(r.id)}
                                title={`Captura ${numeroCaptura.get(r.capturaId) ?? r.capturaId} · ${CLASE_VEGETACION[r.clasificacion].texto} · NDVI ${r.ndvi.promedio.toFixed(2)}`}
                                className={`aspect-square rounded-lg border-2 relative overflow-hidden ${borde(r)} ${r.id === seleccion ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                            >
                                <ImagenCaptura vueloId={datos.vueloId} capturaId={r.capturaId} banda="RGB" className="w-full h-full" alt={`Captura ${numeroCaptura.get(r.capturaId) ?? ''}`} />
                                {r.esCritica && (
                                    <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center"><AlertTriangle size={8} className="text-white" /></div>
                                )}
                                {!r.esCritica && (r.clasificacion === 'ESTRES_MODERADO' || r.clasificacion === 'ESTRES_ALTO') && (
                                    <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#F16C07] rounded-full flex items-center justify-center"><Info size={8} className="text-white" /></div>
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">● Rojo: captura con anomalía detectada · ● Naranja: captura con estrés moderado</p>

                    {/* Detalle de la captura elegida */}
                    {actual && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">Captura {numeroCaptura.get(actual.capturaId) ?? actual.capturaId}</p>
                                <Badge color={actual.esCritica ? 'danger' : 'success'}>{actual.esCritica ? 'Crítica' : 'Sin alerta'}</Badge>
                                <span className="text-xs text-muted-foreground">{CLASE_VEGETACION[actual.clasificacion].texto}</span>
                                {actual.ubicacion && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin size={12} />{actual.ubicacion.latitud.toFixed(6)}, {actual.ubicacion.longitud.toFixed(6)}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {INDICES.map((i) => (
                                    <div key={i.clave} className="rounded-lg bg-muted/60 p-2">
                                        <p className="text-[11px] text-muted-foreground">{i.nombre}</p>
                                        <p className="font-bold text-foreground">{actual[i.clave] ? actual[i.clave]!.promedio.toFixed(2) : '—'}</p>
                                    </div>
                                ))}
                            </div>
                            <BarraDistribucion distribucion={actual.distribucionNdvi} alta />
                            {actual.interpretacionIa && (
                                <div className="rounded-xl border border-border p-3 space-y-2 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-foreground flex items-center gap-1.5"><Bot size={14} />Lo que ve la IA</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${NIVEL_CLASES[actual.interpretacionIa.confianza]}`}>
                                            Confianza {(NIVEL_TEXTO[actual.interpretacionIa.confianza] ?? 'media').toLowerCase()}
                                        </span>
                                    </div>
                                    {(actual.interpretacionIa.cultivosVisibles ?? []).length > 0 && (
                                        <p className="text-xs text-muted-foreground">Cultivos visibles: {actual.interpretacionIa.cultivosVisibles.join(', ')}</p>
                                    )}
                                    {(actual.interpretacionIa.hallazgos ?? []).length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {(actual.interpretacionIa.hallazgos ?? []).map((h, i) => (
                                                <li key={i} className="rounded-lg bg-muted/60 p-2">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="font-semibold text-foreground text-xs">{TIPO_HALLAZGO[h.tipo] ?? h.tipo}</span>
                                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${NIVEL_CLASES[h.severidad]}`}>{NIVEL_TEXTO[h.severidad]}</span>
                                                        <span className="text-[11px] text-muted-foreground">· {h.ubicacionEnImagen}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{h.descripcion}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Sin hallazgos relevantes.</p>
                                    )}
                                    {actual.interpretacionIa.zonaCandidataSiembra?.hayZonas && (
                                        <p className="text-xs text-emerald-800 bg-emerald-50 rounded-lg p-2">
                                            <span className="font-semibold">Zona candidata para siembra: </span>{actual.interpretacionIa.zonaCandidataSiembra?.descripcion}
                                        </p>
                                    )}
                                    {actual.interpretacionIa.recomendacion && (
                                        <p className="text-xs text-foreground"><span className="font-semibold">Recomendación: </span>{actual.interpretacionIa.recomendacion}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Ubicación de las capturas (GPS) */}
                {lista.length > 0 && vuelo.data && (
                    <Card className="mb-4 print:hidden">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><MapPin size={16} className="text-primary" />Ubicación de las capturas</h3>
                        <MapaVuelo
                            loteId={vuelo.data.loteId}
                            subLoteId={vuelo.data.subLoteId}
                            resultados={lista}
                            seleccion={seleccion}
                            onSeleccionar={setSeleccion}
                            huellaM={Math.round((vuelo.data.alturaVueloM ?? ALTURA_VUELO_POR_DEFECTO_M) * FACTOR_HUELLA_CAMARA)}
                        />
                    </Card>
                )}

                <div className="flex flex-wrap gap-2 mt-4 print:hidden">
                    {esAprendiz ? (
                        <Btn variant="outline" onClick={() => navigate('/mis-novedades?reportar=1')}><AlertCircle size={14} />Reportar novedad sobre este lote</Btn>
                    ) : (
                        <>
                            {puede('incidencias.gestionar') && (
                                <Btn
                                    variant="outline"
                                    onClick={() =>
                                        navigate('/incidencias', {
                                            state: {
                                                nuevaIncidencia: {
                                                    cultivoId: vuelo.data?.cultivoId ?? null,
                                                    descripcion: `Detectado en el vuelo de dron "${vuelo.data?.nombre ?? ''}" (${fechaCortaDron(vuelo.data?.fechaVuelo)}): ${resumen.capturasCriticas} capturas críticas, ${resumen.distribucionNdvi.SALUDABLE.toFixed(0)}% de vegetación saludable.`,
                                                },
                                            },
                                        })
                                    }
                                >
                                    <AlertTriangle size={14} />Crear incidencia
                                </Btn>
                            )}
                            <Btn variant="outline" onClick={() => navigate('/actividades', { state: { nuevaEnLote: vuelo.data?.loteId } })}><ClipboardList size={14} />Planear tratamiento</Btn>
                        </>
                    )}
                    <Btn variant="ghost" onClick={volver}><ChevronLeft size={14} />Volver al vuelo</Btn>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ResultadoAnalisis;
