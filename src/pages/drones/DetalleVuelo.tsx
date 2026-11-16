import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle, AlertTriangle, BarChart3, Bot, Check, CheckCircle, ChevronDown, ChevronUp, Cpu, Download, Droplets, Images, Info, Loader2, Plane,
    RotateCcw, Sparkles, Thermometer, Trash2,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Input, Modal, PageHeader, Tab } from '../../components/ui/AgroUI';
import { BarraDistribucion, EstadoVueloBadge, ImagenCaptura } from '../../components/drones/ComponentesDron';
import { nivelUV } from '../../components/sensores/medidas';
import { reportesApi } from '../../api/reportes';
import CargaImagenes from '../../components/drones/CargarImagenes';
import { dronesApi, vuelosApi } from '../../api/drones/drones';
import { lotesApi, sublotesApi } from '../../api/territorio';
import { cultivosApi } from '../../api/cultivo/cultivos';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { PERMISOS_DRONES, type Analisis, type Banda, type Captura } from '../../types/drones/drones';
import { colorSalud, fechaCortaDron, fechaHoraDron } from '../../utils/drones/drones';

const PASOS = ['Registrar', 'Subir imágenes', 'Analizar', 'Resultados'];

const PESTANAS = ['Imágenes', 'Análisis', 'Historial del lote'];
const BANDAS: Banda[] = ['RGB', 'G', 'R', 'RE', 'NIR'];
const EN_CURSO = (a: Analisis) => a.estado === 'PENDIENTE' || a.estado === 'PROCESANDO';

const UMBRALES_DEFECTO = { sinVegetacion: '0.2', estresAlto: '0.4', saludable: '0.6', porcentajeCritico: '30' };

const DetalleVuelo = () => {
    const { id } = useParams();
    const vueloId = Number(id);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [params, setParams] = useSearchParams();
    const { puede } = usePermisos();
    const puedeCargar = puede(PERMISOS_DRONES.CARGAR_IMAGENES);
    const puedeAnalizar = puede(PERMISOS_DRONES.SOLICITAR_ANALISIS);
    const puedeGestionar = puede(PERMISOS_DRONES.GESTIONAR_VUELOS);

    const tabParam = params.get('tab');
    const pestana = tabParam === 'analisis' ? 'Análisis' : tabParam === 'historial' ? 'Historial del lote' : 'Imágenes';
    const [filtroCapturas, setFiltroCapturas] = useState<'todas' | 'completas' | 'incompletas'>('todas');
    const [visor, setVisor] = useState<Captura | null>(null);
    const [bandaVisor, setBandaVisor] = useState<Banda>('RGB');
    const [modalAnalisis, setModalAnalisis] = useState(false);
    const [usarIa, setUsarIa] = useState(true);
    const [contexto, setContexto] = useState('');
    const [avanzado, setAvanzado] = useState(false);
    const [umbrales, setUmbrales] = useState(UMBRALES_DEFECTO);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);
    const [confirmarEliminar, setConfirmarEliminar] = useState(false);

    const vuelo = useQuery({
        queryKey: ['vuelo', vueloId],
        queryFn: async () => (await vuelosApi.obtener(vueloId)).data,
        enabled: Number.isFinite(vueloId),
        refetchInterval: (query) => (query.state.data?.estado === 'ANALIZANDO' ? 4000 : false),
    });

    const capturas = useQuery({
        queryKey: ['vuelo', vueloId, 'capturas'],
        queryFn: async () => (await vuelosApi.capturas(vueloId)).data,
        enabled: Number.isFinite(vueloId),
    });

    const analisis = useQuery({
        queryKey: ['vuelo', vueloId, 'analisis'],
        queryFn: async () => (await vuelosApi.analisis(vueloId)).data,
        enabled: Number.isFinite(vueloId),
        refetchInterval: (query) => (query.state.data?.some(EN_CURSO) ? 3000 : false),
    });

    const drones = useQuery({ queryKey: ['drones'], queryFn: async () => (await dronesApi.listar()).data });
    const lotes = useQuery({ queryKey: ['lotes'], queryFn: async () => (await lotesApi.listar()).data });
    const datos = vuelo.data;

    const sublotes = useQuery({
        queryKey: ['sublotes', String(datos?.loteId ?? '')],
        queryFn: async () => (await sublotesApi.porLote(datos!.loteId)).data,
        enabled: !!datos?.subLoteId,
    });

    const cultivos = useQuery({
        queryKey: ['cultivos', 'lote', String(datos?.loteId ?? '')],
        queryFn: async () => (await cultivosApi.listarPorLote(datos!.loteId)).data,
        enabled: !!datos?.cultivoId,
    });

    // Lo que midieron las estaciones del lote el día del vuelo
    const condiciones = useQuery({
        queryKey: ['clima-dia', datos?.loteId, datos?.fechaVuelo],
        queryFn: async () => (await reportesApi.climaDelDia(datos!.loteId, datos!.fechaVuelo.slice(0, 10))).data,
        enabled: !!datos,
    });

    const vuelosDelLote = useQuery({
        queryKey: ['vuelos', 'lote', datos?.loteId],
        queryFn: async () => (await vuelosApi.listar({ loteId: datos!.loteId })).data,
        enabled: !!datos && pestana === 'Historial del lote',
    });

    const listaAnalisis = useMemo(() => [...(analisis.data ?? [])].sort((a, b) => b.id - a.id), [analisis.data]);
    const enCurso = listaAnalisis.find(EN_CURSO) ?? null;
    const ultimoCompletado = listaAnalisis.find((a) => a.estado === 'COMPLETADO') ?? null;
    const listaCapturas = capturas.data ?? [];
    const completas = listaCapturas.filter((c) => c.completa).length;
    const analizando = datos?.estado === 'ANALIZANDO' || !!enCurso;

    const capturasFiltradas = listaCapturas
        .filter((c) => filtroCapturas === 'todas' || (filtroCapturas === 'completas' ? c.completa : !c.completa))
        .sort((a, b) => a.numeroCaptura - b.numeroCaptura);

    const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: ['vuelo', vueloId] });
        queryClient.invalidateQueries({ queryKey: ['vuelos'] });
    };

    const solicitar = useMutation({
        mutationFn: () =>
            vuelosApi.solicitarAnalisis(vueloId, {
                usarIa,
                contexto: contexto.trim() || undefined,
                ...(avanzado
                    ? {
                          umbralSinVegetacion: Number(umbrales.sinVegetacion),
                          umbralEstresAlto: Number(umbrales.estresAlto),
                          umbralSaludable: Number(umbrales.saludable),
                          porcentajeCritico: Number(umbrales.porcentajeCritico),
                      }
                    : {}),
            }),
        onSuccess: () => {
            setModalAnalisis(false);
            refrescar();
            setParams({ tab: 'analisis' }, { replace: true });
        },
    });

    const eliminar = useMutation({
        mutationFn: () => vuelosApi.eliminar(vueloId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vuelos'] });
            navigate('/drones/vuelos', { replace: true });
        },
    });

    const abrirAnalisis = () => {
        setErrorLocal(null);
        solicitar.reset();
        setModalAnalisis(true);
    };

    const enviarAnalisis = (e: React.FormEvent) => {
        e.preventDefault();
        if (avanzado) {
            const s = Number(umbrales.sinVegetacion);
            const a = Number(umbrales.estresAlto);
            const h = Number(umbrales.saludable);
            const p = Number(umbrales.porcentajeCritico);
            if ([s, a, h, p].some((n) => Number.isNaN(n))) 
                return setErrorLocal('Todos los umbrales deben ser números');
            if (!(s >= -1 && s < a && a < h && h <= 1)) 
                return setErrorLocal('Los umbrales deben cumplir: -1 ≤ sin vegetación < estrés alto < saludable ≤ 1');
            if (p <= 0 || p > 100) 
                return setErrorLocal('El porcentaje crítico debe estar entre 1 y 100');
        }
        setErrorLocal(null);
        solicitar.mutate();
    };

    const abrirVisor = (captura: Captura) => {
        setBandaVisor(captura.archivos.RGB ? 'RGB' : (BANDAS.find((b) => captura.archivos[b]) ?? 'RGB'));
        setVisor(captura);
    };

    if (vuelo.isLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-6xl mx-auto p-6 space-y-4">
                    <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
                    <div className="h-32 rounded-xl bg-muted animate-pulse" />
                    <div className="h-64 rounded-xl bg-muted animate-pulse" />
                </div>
            </DashboardLayout>
        );
    }

    if (vuelo.error || !datos) {
        return (
            <DashboardLayout>
                <div className="max-w-6xl mx-auto p-6">
                    <EmptyState
                        icon={Plane}
                        title="No se pudo abrir el vuelo"
                        description={mensajeError(vuelo.error, 'El vuelo no existe o no tienes acceso a él.')}
                        action={<Btn onClick={() => navigate('/drones/vuelos')}>Volver a vuelos</Btn>}
                    />
                </div>
            </DashboardLayout>
        );
    }

    const dron = drones.data?.find((d) => d.id === datos.dronId);
    const lote = lotes.data?.find((l) => l.id === datos.loteId);
    const sublote = sublotes.data?.find((s) => s.id === datos.subLoteId);
    const cultivo = cultivos.data?.find((c) => c.id === datos.cultivoId);
    const resumen = ultimoCompletado?.resumen ?? null;

    const pasoActual =
        datos.estado === 'REGISTRADO' ? 0 : datos.estado === 'CON_IMAGENES' ? 1 : datos.estado === 'ANALIZADO' ? 3 : 2;

    const motivoNoAnalizar =
        completas === 0
            ? 'Necesitas al menos una captura con las 5 bandas para analizar.'
            : analizando
              ? 'Ya hay un análisis en curso.'
              : null;

    const clima = condiciones.data;
    const hayClima = !!clima && (clima.temperatura !== null || clima.humedad !== null || clima.uv !== null);
    const sintesis = resumen?.ia.sintesis ?? null;
    const otrosVuelos = (vuelosDelLote.data ?? []).filter((v) => v.id !== datos.id).sort((a, b) => (a.fechaVuelo < b.fechaVuelo ? 1 : -1));

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title={datos.nombre}
                    subtitle={`${dron?.nombre ?? '—'} · ${lote?.nombre ?? '—'}${sublote ? ` · ${sublote.nombre}` : ''}`}
                    onBack={() => navigate('/drones/vuelos')}
                    action={
                        <div className="flex items-center gap-2">
                            <EstadoVueloBadge estado={datos.estado} />
                            {puedeGestionar && (
                                <Btn variant="ghost" size="sm" className="text-red-600" disabled={analizando} onClick={() => setConfirmarEliminar(true)} title="Eliminar vuelo">
                                    <Trash2 size={14} />
                                </Btn>
                            )}
                        </div>
                    }
                />

                {/* Datos del vuelo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="p-3 bg-card border border-border rounded-xl"><p className="text-xs text-muted-foreground">Fecha</p><p className="font-semibold text-sm">{fechaCortaDron(datos.fechaVuelo)}</p></div>
                    <div className="p-3 bg-card border border-border rounded-xl"><p className="text-xs text-muted-foreground">Altura</p><p className="font-semibold text-sm">{datos.alturaVueloM ? `${datos.alturaVueloM} m` : '—'}</p></div>
                    <div className="p-3 bg-card border border-border rounded-xl"><p className="text-xs text-muted-foreground">Capturas</p><p className="font-semibold text-sm">{datos.totalCapturas}</p></div>
                    <div className="p-3 bg-card border border-border rounded-xl"><p className="text-xs text-muted-foreground">Cultivo</p><p className="font-semibold text-sm">{cultivo?.nombreCultivo ?? '—'}</p></div>
                </div>
                {datos.observaciones && <p className="text-sm text-muted-foreground -mt-3 mb-6">{datos.observaciones}</p>}

                {/* Pasos */}
                <div className="flex items-center gap-1 mb-6 overflow-x-auto">
                    {PASOS.map((paso, i) => (
                        <div key={paso} className="flex items-center gap-1">
                            <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${
                                    i === pasoActual ? 'bg-primary text-white' : i < pasoActual ? 'bg-chip-bg text-chip-fg' : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {i < pasoActual ? <Check size={12} /> : i === pasoActual && analizando ? <Loader2 size={12} className="animate-spin" /> : <span className="text-xs">{i + 1}</span>}
                                {paso}
                            </div>
                            {i < PASOS.length - 1 && <div className="w-6 h-0.5 bg-border shrink-0" />}
                        </div>
                    ))}
                </div>

                {/* Condiciones del día del vuelo, según las estaciones del lote */}
                {hayClima && (
                    <Card className="mb-4">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Thermometer size={16} className="text-primary" />Condiciones del día del vuelo</h3>
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                            {clima!.temperatura !== null && <span className="flex items-center gap-1 text-muted-foreground"><Thermometer size={12} />{clima!.temperatura}°C</span>}
                            {clima!.humedad !== null && <span className="flex items-center gap-1 text-muted-foreground"><Droplets size={12} />{clima!.humedad}%</span>}
                            {clima!.uv !== null && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${nivelUV(clima!.uv).bg} ${nivelUV(clima!.uv).color}`}>
                                    UV {clima!.uv} · {nivelUV(clima!.uv).label}
                                </span>
                            )}
                        </div>
                    </Card>
                )}

                <Tab
                    tabs={PESTANAS}
                    active={pestana}
                    onChange={(t) => setParams({ tab: t === 'Análisis' ? 'analisis' : t === 'Historial del lote' ? 'historial' : 'imagenes' }, { replace: true })}
                />

                {pestana === 'Imágenes' && (
                    <div className="space-y-4">
                        {analizando && (
                            <div className="p-4 bg-muted border border-border rounded-xl flex items-center gap-3 opacity-70">
                                <AlertCircle size={16} className="text-muted-foreground shrink-0" />
                                <p className="text-sm text-muted-foreground">No puedes subir imágenes mientras se analiza el vuelo.</p>
                            </div>
                        )}
                        {datos.estado === 'ANALIZADO' && (
                            <div className="p-3 bg-[#FFF3E0] border border-[#F16C07]/30 rounded-xl flex items-start gap-2">
                                <AlertCircle size={14} className="text-[#F16C07] shrink-0 mt-0.5" />
                                <p className="text-xs text-[#E65100]">Si subes más imágenes tendrás que volver a analizar el vuelo.</p>
                            </div>
                        )}
                        {puedeCargar && !analizando && (
                            <CargaImagenes
                                vueloId={vueloId}
                                bloqueado={analizando}
                                motivoBloqueo="El vuelo se está analizando. Espera a que termine para cargar más imágenes."
                                alTerminar={refrescar}
                            />
                        )}

                        {listaCapturas.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">Capturas ({listaCapturas.length}) · {completas} completas</p>
                                <div className="flex gap-1 bg-muted p-1 rounded-lg text-xs">
                                    {(['todas', 'completas', 'incompletas'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFiltroCapturas(f)}
                                            className={`px-3 py-1 rounded-md font-semibold capitalize ${filtroCapturas === f ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {capturas.isLoading && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />)}
                            </div>
                        )}

                        {capturas.error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                {mensajeError(capturas.error, 'No se pudieron cargar las capturas')}
                            </div>
                        )}

                        {!capturas.isLoading && listaCapturas.length === 0 && !puedeCargar && (
                            <EmptyState icon={Images} title="Sin imágenes" description="Aún no se han cargado imágenes." />
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {capturasFiltradas.map((captura) => (
                                <button
                                    key={captura.id}
                                    onClick={() => abrirVisor(captura)}
                                    className="text-left rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <ImagenCaptura
                                        vueloId={vueloId}
                                        capturaId={captura.id}
                                        banda={captura.archivos.RGB ? 'RGB' : 'G'}
                                        className="w-full aspect-[4/3]"
                                        alt={`Captura ${captura.numeroCaptura}`}
                                    />
                                    <div className="p-2">
                                        <p className="text-xs font-semibold text-foreground">Captura {captura.numeroCaptura}</p>
                                        {captura.completa ? (
                                            <p className="text-[11px] text-emerald-700">5 bandas ✓</p>
                                        ) : (
                                            <p className="text-[11px] text-amber-700 truncate" title={`Faltan: ${captura.bandasFaltantes.join(', ')}`}>
                                                Faltan: {captura.bandasFaltantes.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {!puedeAnalizar && datos.estado !== 'ANALIZADO' && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                                <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 flex-1">Tu instructor iniciará el análisis cuando estén todas las imágenes.</p>
                            </div>
                        )}
                        {puedeAnalizar && (
                            <div className="space-y-1">
                                <Btn onClick={abrirAnalisis} disabled={!!motivoNoAnalizar} className="w-full justify-center"><Cpu size={14} />Analizar con IA</Btn>
                                {motivoNoAnalizar && <p className="text-xs text-muted-foreground text-center">{motivoNoAnalizar}</p>}
                            </div>
                        )}
                    </div>
                )}

                {pestana === 'Análisis' && (
                    <div className="space-y-4">
                        {enCurso && (
                            <Card className="border-amber-200 bg-amber-50/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <Loader2 size={20} className="animate-spin text-amber-600" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-foreground">
                                            {enCurso.estado === 'PENDIENTE' ? 'En cola…' : enCurso.etapa === 'INTERPRETACION_IA' ? 'La IA está interpretando las capturas' : 'Calculando índices de vegetación'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {enCurso.etapa === 'INTERPRETACION_IA'
                                                ? `${enCurso.capturasInterpretadas} de ${enCurso.capturasAInterpretar} capturas interpretadas`
                                                : `${enCurso.capturasProcesadas} de ${enCurso.capturasTotales} capturas procesadas`}
                                        </p>
                                    </div>
                                    <span className="text-lg font-bold text-amber-700">{enCurso.progreso}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
                                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${enCurso.progreso}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Puedes salir de esta pantalla; el análisis sigue en segundo plano.</p>
                            </Card>
                        )}

                        {analisis.isLoading && <div className="h-24 rounded-xl bg-muted animate-pulse" />}

                        {!analisis.isLoading && resumen && ultimoCompletado && (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl text-center">
                                        <p className="text-3xl font-bold text-primary">{resumen.distribucionNdvi.SALUDABLE.toFixed(0)}%</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Vegetación saludable</p>
                                    </div>
                                    {[
                                        { label: 'NDVI prom.', val: resumen.ndvi ? resumen.ndvi.promedio.toFixed(2) : '—' },
                                        { label: 'NDRE prom.', val: resumen.ndre ? resumen.ndre.promedio.toFixed(2) : '—' },
                                        { label: 'Cobertura', val: resumen.cobertura ? `${resumen.cobertura.VEGETACION.toFixed(0)}%` : '—' },
                                    ].map((dato) => (
                                        <div key={dato.label} className="p-4 bg-muted rounded-xl text-center">
                                            <p className="text-2xl font-bold text-foreground">{dato.val}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{dato.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <Card>
                                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Sparkles size={16} className="text-primary" />Interpretación de la IA</h3>
                                    {sintesis ? (
                                        <>
                                            <p className="text-sm text-muted-foreground mb-3">{sintesis.resumen}</p>
                                            <div className="space-y-2">
                                                {sintesis.hallazgosPrincipales.map((h) => (
                                                    <div key={h} className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" /><p className="text-sm">{h}</p></div>
                                                ))}
                                                {sintesis.advertencias.map((a) => (
                                                    <div key={a} className="flex items-start gap-2"><AlertTriangle size={14} className="text-[#F16C07] mt-0.5 shrink-0" /><p className="text-sm">{a}</p></div>
                                                ))}
                                                {sintesis.recomendaciones.map((r) => (
                                                    <div key={r} className="flex items-start gap-2"><Info size={14} className="text-blue-500 mt-0.5 shrink-0" /><p className="text-sm">{r}</p></div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {resumen.ia.mensaje ?? 'Este análisis se hizo sin interpretación de IA. Puedes volver a analizar el vuelo activándola.'}
                                        </p>
                                    )}
                                </Card>

                                <div className="flex flex-wrap gap-2">
                                    <Btn onClick={() => navigate(`/drones/analisis/${ultimoCompletado.id}`)}><BarChart3 size={14} />Ver análisis completo</Btn>
                                    <Btn variant="outline" onClick={() => navigate(`/drones/analisis/${ultimoCompletado.id}?imprimir=1`)}><Download size={14} />Descargar PDF</Btn>
                                    {puedeAnalizar && (
                                        <Btn variant="ghost" onClick={abrirAnalisis} disabled={!!motivoNoAnalizar}><RotateCcw size={14} />Volver a analizar</Btn>
                                    )}
                                </div>
                            </>
                        )}

                        {!analisis.isLoading && !resumen && !enCurso && (
                            <EmptyState
                                icon={BarChart3}
                                title="Análisis no disponible"
                                description={
                                    puedeAnalizar
                                        ? motivoNoAnalizar ?? 'Sube imágenes y luego inicia el análisis para ver los resultados.'
                                        : 'Tu instructor iniciará el análisis cuando las imágenes estén completas.'
                                }
                                action={puedeAnalizar && !motivoNoAnalizar ? <Btn onClick={abrirAnalisis}>Analizar vuelo</Btn> : undefined}
                            />
                        )}

                        {listaAnalisis.length > 1 && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-foreground pt-2">Análisis anteriores de este vuelo</p>
                                {listaAnalisis.map((a) => {
                                    const saludable = a.resumen?.distribucionNdvi.SALUDABLE ?? null;
                                    return (
                                        <Card
                                            key={a.id}
                                            onClick={a.estado === 'COMPLETADO' ? () => navigate(`/drones/analisis/${a.id}`) : undefined}
                                            className="flex flex-wrap items-center gap-3"
                                        >
                                            <div className="flex-1 min-w-[180px]">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-foreground">Análisis #{a.id}</p>
                                                    {a.estado === 'COMPLETADO' && <Badge color="success">Completado</Badge>}
                                                    {a.estado === 'ERROR' && <Badge color="danger">Error</Badge>}
                                                    {EN_CURSO(a) && <Badge color="warning">{a.progreso}%</Badge>}
                                                    {a.usarIa && <Badge color="info"><Bot size={12} className="mr-1" />IA</Badge>}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {fechaHoraDron(a.finalizadoEn ?? a.iniciadoEn)} · {a.capturasTotales} capturas
                                                    {a.contexto && ` · "${a.contexto}"`}
                                                </p>
                                                {a.estado === 'ERROR' && a.mensajeError && <p className="text-xs text-red-600 mt-1">{a.mensajeError}</p>}
                                            </div>
                                            {a.estado === 'COMPLETADO' && a.resumen && (
                                                <div className="w-full sm:w-64 space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Saludable</span>
                                                        <span className="font-bold" style={{ color: colorSalud(saludable) }}>{saludable?.toFixed(0)}%</span>
                                                    </div>
                                                    <BarraDistribucion distribucion={a.resumen.distribucionNdvi} />
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {pestana === 'Historial del lote' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Vuelos anteriores en el mismo lote.</p>
                        {vuelosDelLote.isLoading && <div className="h-16 rounded-xl bg-muted animate-pulse" />}
                        {!vuelosDelLote.isLoading && otrosVuelos.length === 0 && (
                            <EmptyState icon={Plane} title="Sin otros vuelos" description="Este es el único vuelo registrado en el lote." />
                        )}
                        {otrosVuelos.map((v) => {
                            const salud = v.ultimoAnalisis?.estado === 'COMPLETADO' ? v.ultimoAnalisis.saludablePct : null;
                            return (
                                <Card key={v.id} onClick={() => navigate(`/drones/vuelos/${v.id}`)}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-foreground">{v.nombre}</p>
                                            <p className="text-xs text-muted-foreground">{fechaCortaDron(v.fechaVuelo)} · {v.totalCapturas} capturas</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {salud != null && <span className={`text-sm font-bold ${salud >= 70 ? 'text-primary' : 'text-[#F59E0B]'}`}>{salud.toFixed(0)}%</span>}
                                            <EstadoVueloBadge estado={v.estado} />
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Modal open={visor !== null} onClose={() => setVisor(null)} title={visor ? `Captura ${visor.numeroCaptura}` : ''}>
                {visor && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                            {BANDAS.map((b) => (
                                <button
                                    key={b}
                                    disabled={!visor.archivos[b]}
                                    onClick={() => setBandaVisor(b)}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold border ${
                                        bandaVisor === b ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground'
                                    } ${!visor.archivos[b] ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                        <ImagenCaptura
                            vueloId={vueloId}
                            capturaId={visor.id}
                            banda={bandaVisor}
                            tamano="completa"
                            className="w-full rounded-lg min-h-[240px] object-contain bg-black"
                            alt={`Captura ${visor.numeroCaptura} banda ${bandaVisor}`}
                        />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-muted p-2">
                                <p className="text-muted-foreground">Tomada</p>
                                <p className="font-semibold text-foreground">{fechaHoraDron(visor.tomadaEn)}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-2">
                                <p className="text-muted-foreground">Altitud</p>
                                <p className="font-semibold text-foreground">{visor.altitudRelativaM !== null ? `${visor.altitudRelativaM.toFixed(1)} m` : '—'}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-2 col-span-2">
                                <p className="text-muted-foreground">Ubicación</p>
                                <p className="font-semibold text-foreground">
                                    {visor.ubicacion ? `${visor.ubicacion.latitud.toFixed(6)}, ${visor.ubicacion.longitud.toFixed(6)}` : 'Sin GPS'}
                                </p>
                            </div>
                        </div>
                        {!visor.completa && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                Faltan las bandas {visor.bandasFaltantes.join(', ')}. Esta captura no entrará en el análisis hasta que se suban.
                            </p>
                        )}
                    </div>
                )}
            </Modal>

            <Modal open={modalAnalisis} onClose={() => setModalAnalisis(false)} title="Analizar vuelo">
                <form className="space-y-4" onSubmit={enviarAnalisis}>
                    {(errorLocal || solicitar.error) && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {errorLocal ?? mensajeError(solicitar.error, 'No se pudo iniciar el análisis')}
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                        Se analizarán <strong>{completas} capturas</strong>.
                        {listaCapturas.length > completas && ` ${listaCapturas.length - completas} incompletas se omitirán.`}
                    </p>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                        <div>
                            <p className="text-sm font-medium text-foreground">Usar inteligencia artificial</p>
                            <p className="text-xs text-muted-foreground">Tarda más, pero da hallazgos y recomendaciones</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={usarIa}
                            onClick={() => setUsarIa(!usarIa)}
                            className={`w-11 h-6 rounded-full relative transition-colors ${usarIa ? 'bg-primary' : 'bg-muted border border-border'}`}
                        >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${usarIa ? 'left-5' : 'left-0.5'}`} />
                        </button>
                    </div>
                    {usarIa && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-foreground">Contexto para la IA (opcional)</label>
                            <textarea
                                rows={2}
                                value={contexto}
                                maxLength={500}
                                onChange={(e) => setContexto(e.target.value)}
                                placeholder="Ej: Maíz de 45 días, riego hace 3 días..."
                                className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
                            />
                        </div>
                    )}
                    <div>
                        <button
                            type="button"
                            onClick={() => setAvanzado(!avanzado)}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
                        >
                            {avanzado ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Configuración avanzada
                        </button>
                        {avanzado && (
                            <div className="mt-3 p-3 border border-border rounded-xl space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="NDVI sin veg." type="number" step="0.01" value={umbrales.sinVegetacion} onChange={(v) => setUmbrales({ ...umbrales, sinVegetacion: v })} />
                                    <Input label="NDVI estrés" type="number" step="0.01" value={umbrales.estresAlto} onChange={(v) => setUmbrales({ ...umbrales, estresAlto: v })} />
                                    <Input label="NDVI saludable" type="number" step="0.01" value={umbrales.saludable} onChange={(v) => setUmbrales({ ...umbrales, saludable: v })} />
                                    <Input label="% crítico" type="number" step="1" value={umbrales.porcentajeCritico} onChange={(v) => setUmbrales({ ...umbrales, porcentajeCritico: v })} />
                                </div>
                                <button type="button" onClick={() => setUmbrales(UMBRALES_DEFECTO)} className="text-xs text-primary hover:underline">
                                    Restaurar valores
                                </button>
                            </div>
                        )}
                    </div>
                    <Btn type="submit" disabled={solicitar.isPending} className="w-full justify-center">
                        {solicitar.isPending ? 'Iniciando...' : 'Iniciar análisis'}
                    </Btn>
                </form>
            </Modal>

            <Modal open={confirmarEliminar} onClose={() => setConfirmarEliminar(false)} title="Eliminar vuelo">
                <p className="text-sm text-muted-foreground mb-4">
                    Se eliminará el vuelo <span className="font-semibold text-foreground">{datos.nombre}</span> junto con sus imágenes y análisis. Esta acción no se puede deshacer.
                </p>
                {eliminar.error && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{mensajeError(eliminar.error, 'No se pudo eliminar el vuelo')}</div>
                )}
                <div className="flex gap-3">
                    <Btn variant="danger" disabled={eliminar.isPending} onClick={() => eliminar.mutate()} className="flex-1 justify-center">
                        {eliminar.isPending ? 'Eliminando...' : 'Eliminar'}
                    </Btn>
                    <Btn variant="outline" onClick={() => setConfirmarEliminar(false)}>Cancelar</Btn>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default DetalleVuelo;
