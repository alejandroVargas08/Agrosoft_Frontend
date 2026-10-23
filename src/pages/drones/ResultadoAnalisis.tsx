import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, Bot, Droplets, Images, Leaf, Lightbulb, MapPin, Sprout, TriangleAlert } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, PageHeader, StatCard } from '../../components/ui/AgroUI';
import { BarraDistribucion, ImagenCaptura } from '../../components/drones/ComponentesDron';
import { analisisApi, vuelosApi } from '../../api/drones/drones';
import { mensajeError } from '../../api/errores/errores';
import { CAPAS, CLASE_VEGETACION, LEYENDA_CAPA, NIVEL_CLASES, NIVEL_TEXTO, TIPO_HALLAZGO, type CapaMapa, type ClaseVegetacion, type EstadisticasIndice, type ResultadoCaptura } from '../../types/drones/drones';
import { colorSalud, fechaCortaDron, fechaHoraDron } from '../../utils/drones/drones';

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

const Estadistica = ({ nombre, descripcion, datos }: { nombre: string; descripcion: string; datos: EstadisticasIndice | null }) => (
    <div className="rounded-xl bg-muted/60 p-3">
        <div className="flex items-baseline justify-between">
            <p className="font-semibold text-foreground text-sm">{nombre}</p>
            <p className="text-lg font-bold text-foreground">{datos ? datos.promedio.toFixed(2) : '—'}</p>
        </div>
        <p className="text-[11px] text-muted-foreground">{descripcion}</p>
        {datos && <p className="text-[11px] text-muted-foreground mt-1">mín {datos.minimo.toFixed(2)} · máx {datos.maximo.toFixed(2)} · σ {datos.desviacion.toFixed(2)}</p>}
    </div>
);

const ResultadoAnalisis = () => {
    const { id } = useParams();
    const analisisId = Number(id);
    const navigate = useNavigate();
    const [capa, setCapa] = useState<CapaMapa>('NDVI');
    const [soloCriticas, setSoloCriticas] = useState(false);
    const [seleccion, setSeleccion] = useState<number | null>(null);

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
    const saludable = resumen.distribucionNdvi.SALUDABLE;
    const ia = resumen.ia ?? { estado: 'DESACTIVADO' as const, capturasInterpretadas: 0, capturasConError: 0, sintesis: null, mensaje: null };
    const sintesis = ia.sintesis;
    const hallazgos = sintesis?.hallazgosPrincipales ?? [];
    const recomendaciones = sintesis?.recomendaciones ?? [];
    const advertencias = sintesis?.advertencias ?? [];
    const infoCapa = CAPAS.find((c) => c.valor === capa)!;

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
                <PageHeader
                    title="Resultados del análisis"
                    subtitle={`${vuelo.data?.nombre ?? `Vuelo #${datos.vueloId}`} · ${fechaCortaDron(vuelo.data?.fechaVuelo)} · analizado ${fechaHoraDron(datos.finalizadoEn)}`}
                    onBack={volver}
                />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={Leaf} label="Vegetación saludable" value={<span style={{ color: colorSalud(saludable) }}>{saludable.toFixed(0)} %</span>} color="emerald" />
                    <StatCard icon={Sprout} label="NDVI promedio" value={resumen.ndvi?.promedio.toFixed(2) ?? '—'} sub="0 a 1, más alto es mejor" />
                    <StatCard icon={Images} label="Capturas analizadas" value={resumen.capturasAnalizadas} sub={(resumen.capturasOmitidas ?? 0) > 0 ? `${resumen.capturasOmitidas} omitidas` : undefined} color="blue" />
                    <StatCard icon={TriangleAlert} label="Capturas críticas" value={resumen.capturasCriticas} sub={`≥ ${datos.umbrales.porcentajeCritico}% estrés alto`} color={resumen.capturasCriticas > 0 ? 'red' : 'primary'} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2 space-y-3">
                        <h3 className="font-semibold text-foreground">Estado del cultivo</h3>
                        <BarraDistribucion distribucion={resumen.distribucionNdvi} alta />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ORDEN_CLASES.map((c) => (
                                <div key={c} className="rounded-lg border border-border p-2">
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLASE_VEGETACION[c].color }} />
                                        {CLASE_VEGETACION[c].texto}
                                    </span>
                                    <p className="text-lg font-bold text-foreground">{resumen.distribucionNdvi[c].toFixed(1)}%</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Umbrales NDVI: sin vegetación &lt; {datos.umbrales.sinVegetacion} · estrés alto &lt; {datos.umbrales.estresAlto} · saludable ≥ {datos.umbrales.saludable}
                        </p>
                    </Card>

                    <Card className="space-y-3">
                        <h3 className="font-semibold text-foreground flex items-center gap-1.5"><Droplets size={16} />Cobertura del terreno</h3>
                        {resumen.cobertura ? (
                            ([
                                ['VEGETACION', 'Vegetación', '#10B981'],
                                ['SIN_VEGETACION', 'Suelo sin vegetación', '#A16207'],
                                ['AGUA', 'Agua', '#2563EB'],
                            ] as const).map(([clave, texto, color]) => (
                                <div key={clave} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{texto}</span>
                                        <span className="font-semibold text-foreground">{resumen.cobertura![clave].toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${resumen.cobertura![clave]}%`, backgroundColor: color }} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Sin datos de cobertura.</p>
                        )}
                    </Card>
                </div>

                <Card>
                    <h3 className="font-semibold text-foreground mb-3">Índices de vegetación</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {INDICES.map((i) => <Estadistica key={i.clave} nombre={i.nombre} descripcion={i.descripcion} datos={resumen[i.clave]} />)}
                    </div>
                </Card>

                <Card className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Bot size={18} className="text-primary" />
                        <h3 className="font-semibold text-foreground">Interpretación de la IA</h3>
                        {ia.estado === 'PARCIAL' && <Badge color="warning">Parcial</Badge>}
                    </div>
                    {sintesis ? (
                        <div className="space-y-3 text-sm">
                            <p className="text-foreground">{sintesis.resumen}</p>
                            {hallazgos.length > 0 && (
                                <div>
                                    <p className="font-semibold text-foreground mb-1">Hallazgos principales</p>
                                    <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">{hallazgos.map((h, i) => <li key={i}>{h}</li>)}</ul>
                                </div>
                            )}
                            {sintesis.zonasCandidatasSiembra && (
                                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                                    <p className="font-semibold text-emerald-800 flex items-center gap-1.5 mb-1"><MapPin size={14} />Zonas candidatas para siembra</p>
                                    <p className="text-emerald-900">{sintesis.zonasCandidatasSiembra}</p>
                                </div>
                            )}
                            {recomendaciones.length > 0 && (
                                <div>
                                    <p className="font-semibold text-foreground flex items-center gap-1.5 mb-1"><Lightbulb size={14} />Recomendaciones</p>
                                    <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">{recomendaciones.map((r, i) => <li key={i}>{r}</li>)}</ul>
                                </div>
                            )}
                            {advertencias.length > 0 && (
                                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                                    <p className="font-semibold text-amber-800 flex items-center gap-1.5 mb-1"><AlertTriangle size={14} />Advertencias</p>
                                    <ul className="list-disc pl-5 space-y-0.5 text-amber-900">{advertencias.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                </div>
                            )}
                            <p className="text-[11px] text-muted-foreground">Generado por IA a partir de {ia.capturasInterpretadas} capturas. Verifica en campo antes de tomar decisiones.</p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {ia.estado === 'DESACTIVADO'
                                ? 'Este análisis se hizo sin interpretación de IA. Puedes volver a analizar el vuelo activándola.'
                                : ia.mensaje ?? 'La IA no generó resultados para este análisis.'}
                        </p>
                    )}
                </Card>

                <Card className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-foreground">Mapa por captura</h3>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                            <input type="checkbox" checked={soloCriticas} onChange={(e) => setSoloCriticas(e.target.checked)} className="accent-[#2D7A3E]" />
                            Solo críticas
                        </label>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {CAPAS.map((c) => (
                            <button
                                key={c.valor}
                                onClick={() => setCapa(c.valor)}
                                title={c.descripcion}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${capa === c.valor ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'}`}
                            >
                                {c.texto}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{infoCapa.descripcion}</p>

                    {resultados.isLoading && <div className="h-80 rounded-xl bg-muted animate-pulse" />}
                    {resultados.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{mensajeError(resultados.error, 'No se pudieron cargar los resultados por captura')}</div>
                    )}
                    {!resultados.isLoading && lista.length === 0 && (
                        <p className="text-sm text-muted-foreground py-6 text-center">{soloCriticas ? 'No hay capturas críticas. ¡Buen estado general!' : 'No hay resultados por captura.'}</p>
                    )}

                    {lista.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
                            <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[560px] pb-1">
                                {lista.map((r) => (
                                    <li key={r.id} className="shrink-0 lg:shrink">
                                        <button
                                            onClick={() => setSeleccion(r.id)}
                                            className={`w-44 lg:w-full text-left rounded-lg border p-2 transition-all ${r.id === seleccion ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:bg-muted'}`}
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-sm font-semibold text-foreground">Captura {numeroCaptura.get(r.capturaId) ?? r.capturaId}</span>
                                                {r.esCritica && <AlertTriangle size={14} className="text-red-600" />}
                                            </div>
                                            <p className="text-[11px] mb-1" style={{ color: CLASE_VEGETACION[r.clasificacion].color }}>
                                                {CLASE_VEGETACION[r.clasificacion].texto} · NDVI {r.ndvi.promedio.toFixed(2)}
                                            </p>
                                            <BarraDistribucion distribucion={r.distribucionNdvi} />
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {actual && (
                                <div className="space-y-3 min-w-0">
                                    <ImagenCaptura
                                        vueloId={datos.vueloId}
                                        capturaId={actual.capturaId}
                                        capa={capa}
                                        banda="RGB"
                                        tamano="completa"
                                        className="w-full rounded-xl min-h-[280px] max-h-[520px] object-contain bg-neutral-900"
                                        alt={`Captura ${numeroCaptura.get(actual.capturaId) ?? ''} capa ${capa}`}
                                    />
                                    <Leyenda capa={capa} />

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge color={actual.esCritica ? 'danger' : 'success'}>{actual.esCritica ? 'Crítica' : 'Sin alerta'}</Badge>
                                        <span className="text-xs text-muted-foreground">Clasificación: {CLASE_VEGETACION[actual.clasificacion].texto}</span>
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

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {ORDEN_CLASES.map((c) => (
                                            <div key={c} className="text-xs">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CLASE_VEGETACION[c].color }} />
                                                    {CLASE_VEGETACION[c].texto}
                                                </span>
                                                <span className="font-semibold text-foreground">{actual.distribucionNdvi[c].toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>

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
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ResultadoAnalisis;

