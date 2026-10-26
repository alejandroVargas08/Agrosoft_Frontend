import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle, BarChart3, Bot, Calendar, Check, ChevronDown, ChevronUp, Images, Info, Loader2, MapPin, Mountain, Plane, Play, Sprout, Trash2,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Input, Modal, PageHeader, Tab, Textarea } from '../../components/ui/AgroUI';
import { BarraDistribucion, EstadoVueloBadge, ImagenCaptura } from '../../components/drones/ComponentesDron';
import CargaImagenes from '../../components/drones/CargarImagenes';
import { dronesApi, vuelosApi } from '../../api/drones/drones';
import { lotesApi, sublotesApi } from '../../api/territorio';
import { cultivosApi } from '../../api/cultivo/cultivos';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { PERMISOS_DRONES, type Analisis, type Banda, type Captura } from '../../types/drones/drones';
import { colorSalud, fechaCortaDron, fechaHoraDron } from '../../utils/drones/drones';

const PESTANAS = ['Imágenes', 'Análisis'];
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

    const pestana = params.get('tab') === 'analisis' ? 'Análisis' : 'Imágenes';
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

    const pasos = [
        { titulo: 'Vuelo registrado', hecho: true },
        { titulo: 'Imágenes cargadas', hecho: datos.totalCapturas > 0 },
        { titulo: 'Análisis', hecho: !!ultimoCompletado, activo: analizando },
        { titulo: 'Resultados', hecho: !!ultimoCompletado },
    ];

    const motivoNoAnalizar =
        completas === 0
            ? 'Necesitas al menos una captura con las 5 bandas para analizar.'
            : analizando
              ? 'Ya hay un análisis en curso.'
              : null;

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title={datos.nombre}
                    subtitle={`${dron?.nombre ?? `Dron #${datos.dronId}`} · ${fechaCortaDron(datos.fechaVuelo)}`}
                    onBack={() => navigate('/drones/vuelos')}
                    action={
                        <div className="flex flex-wrap gap-2">
                            {ultimoCompletado && (
                                <Btn variant="outline" onClick={() => navigate(`/drones/analisis/${ultimoCompletado.id}`)}><BarChart3 size={16} />Ver resultados</Btn>
                            )}
                            {puedeAnalizar && (
                                <Btn onClick={abrirAnalisis} disabled={!!motivoNoAnalizar}>
                                    <Play size={16} />{ultimoCompletado ? 'Analizar de nuevo' : 'Analizar'}
                                </Btn>
                            )}
                            {puedeGestionar && (
                                <Btn variant="ghost" className="text-red-600" disabled={analizando} onClick={() => setConfirmarEliminar(true)}>
                                    <Trash2 size={16} />
                                </Btn>
                            )}
                        </div>
                    }
                />

                <Card className="mb-4">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                        <EstadoVueloBadge estado={datos.estado} />
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Calendar size={14} />{fechaCortaDron(datos.fechaVuelo)}</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin size={14} />{lote?.nombre ?? `Lote #${datos.loteId}`}{sublote && ` · ${sublote.nombre}`}
                        </span>
                        {cultivo && <span className="flex items-center gap-1.5 text-muted-foreground"><Sprout size={14} />{cultivo.nombreCultivo}</span>}
                        {datos.alturaVueloM && <span className="flex items-center gap-1.5 text-muted-foreground"><Mountain size={14} />{datos.alturaVueloM} m</span>}
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Images size={14} />{datos.totalCapturas} capturas · {completas} completas</span>
                        {dron && <Badge color={dron.tipoCamara === 'MULTIESPECTRAL' ? 'primary' : 'info'}>{dron.tipoCamara === 'MULTIESPECTRAL' ? 'Multiespectral' : 'RGB'}</Badge>}
                    </div>
                    {datos.observaciones && <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">{datos.observaciones}</p>}

                    <div className="flex items-center mt-4 pt-4 border-t border-border">
                        {pasos.map((paso, i) => (
                            <div key={paso.titulo} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-1 min-w-[64px]">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            paso.hecho ? 'bg-primary text-primary-foreground' : paso.activo ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {paso.hecho ? <Check size={16} /> : paso.activo ? <Loader2 size={16} className="animate-spin" /> : i + 1}
                                    </div>
                                    <span className="text-[11px] text-center text-muted-foreground leading-tight">{paso.titulo}</span>
                                </div>
                                {i < pasos.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-5 ${pasos[i + 1].hecho || pasos[i + 1].activo ? 'bg-primary' : 'bg-border'}`} />}
                            </div>
                        ))}
                    </div>
                </Card>

                {!puedeAnalizar && puedeCargar && !ultimoCompletado && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-start gap-2">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <span className="flex-1">
                            {completas > 0
                                ? 'Las imágenes ya están cargadas. Tu instructor iniciará el análisis y aquí verás los resultados.'
                                : 'Sube las imágenes del vuelo. Cuando estén completas, tu instructor iniciará el análisis.'}
                        </span>
                        <Btn size="sm" variant="outline" onClick={() => navigate('/incidencias')}><AlertTriangle size={14} />Reportar novedad</Btn>
                    </div>
                )}

                {resumen && (
                    <Card className="mb-4 cursor-pointer" onClick={() => navigate(`/drones/analisis/${ultimoCompletado!.id}`)}>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold" style={{ color: colorSalud(resumen.distribucionNdvi.SALUDABLE) }}>
                                    {resumen.distribucionNdvi.SALUDABLE.toFixed(0)}%
                                </p>
                                <p className="text-xs text-muted-foreground">saludable</p>
                            </div>
                            <div className="flex-1 min-w-[200px] space-y-2">
                                <BarraDistribucion distribucion={resumen.distribucionNdvi} alta />
                                <p className="text-xs text-muted-foreground">
                                    NDVI promedio {resumen.ndvi?.promedio.toFixed(2) ?? '—'} · {resumen.capturasCriticas} capturas críticas · analizado {fechaHoraDron(ultimoCompletado!.finalizadoEn)}
                                </p>
                            </div>
                            <span className="text-sm font-semibold text-primary">Ver resultados →</span>
                        </div>
                    </Card>
                )}

                <Tab tabs={PESTANAS} active={pestana} onChange={(t) => setParams(t === 'Análisis' ? { tab: 'analisis' } : { tab: 'imagenes' }, { replace: true })} />

                {pestana === 'Imágenes' && (
                    <div className="space-y-4">
                        {puedeCargar && (
                            <Card>
                                <h3 className="font-semibold text-foreground mb-3">Subir imágenes</h3>
                                <CargaImagenes
                                    vueloId={vueloId}
                                    bloqueado={analizando}
                                    motivoBloqueo="El vuelo se está analizando. Espera a que termine para cargar más imágenes."
                                    alTerminar={refrescar}
                                />
                            </Card>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-semibold text-foreground">Capturas ({listaCapturas.length})</h3>
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

                        {!capturas.isLoading && listaCapturas.length === 0 && (
                            <EmptyState icon={Images} title="Sin imágenes" description={puedeCargar ? 'Sube las fotos que tomó el dron en este vuelo.' : 'Aún no se han cargado imágenes.'} />
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

                        {!analisis.isLoading && listaAnalisis.length === 0 && (
                            <EmptyState
                                icon={BarChart3}
                                title="Este vuelo aún no se ha analizado"
                                description={
                                    puedeAnalizar
                                        ? motivoNoAnalizar ?? 'Inicia el análisis para conocer la salud del cultivo.'
                                        : 'Tu instructor iniciará el análisis cuando las imágenes estén completas.'
                                }
                                action={puedeAnalizar && !motivoNoAnalizar ? <Btn onClick={abrirAnalisis}><Play size={16} />Analizar</Btn> : undefined}
                            />
                        )}

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
                        Se analizarán <span className="font-semibold text-foreground">{completas}</span> capturas completas.
                        {listaCapturas.length > completas && ` ${listaCapturas.length - completas} incompletas se omitirán.`}
                    </p>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 cursor-pointer">
                        <span>
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Bot size={16} />Interpretación con IA</span>
                            <span className="block text-xs text-muted-foreground">Describe hallazgos y recomendaciones. Tarda más.</span>
                        </span>
                        <input type="checkbox" checked={usarIa} onChange={(e) => setUsarIa(e.target.checked)} className="w-5 h-5 accent-[#2D7A3E]" />
                    </label>
                    {usarIa && (
                        <Textarea
                            label="Contexto para la IA (opcional)"
                            value={contexto}
                            onChange={(v) => setContexto(v.slice(0, 500))}
                            placeholder="Ej: cultivo de maíz de 45 días, se aplicó fertilizante la semana pasada"
                        />
                    )}
                    <button type="button" onClick={() => setAvanzado(!avanzado)} className="flex items-center gap-1 text-sm font-semibold text-primary">
                        {avanzado ? <ChevronUp size={16} /> : <ChevronDown size={16} />}Umbrales avanzados
                    </button>
                    {avanzado && (
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Sin vegetación (NDVI <)" type="number" step="0.01" value={umbrales.sinVegetacion} onChange={(v) => setUmbrales({ ...umbrales, sinVegetacion: v })} />
                            <Input label="Estrés alto (NDVI <)" type="number" step="0.01" value={umbrales.estresAlto} onChange={(v) => setUmbrales({ ...umbrales, estresAlto: v })} />
                            <Input label="Saludable (NDVI ≥)" type="number" step="0.01" value={umbrales.saludable} onChange={(v) => setUmbrales({ ...umbrales, saludable: v })} />
                            <Input label="% crítico de estrés" type="number" step="1" value={umbrales.porcentajeCritico} onChange={(v) => setUmbrales({ ...umbrales, porcentajeCritico: v })} />
                            <button type="button" onClick={() => setUmbrales(UMBRALES_DEFECTO)} className="col-span-2 text-xs text-muted-foreground hover:text-foreground text-left">
                                Restablecer valores por defecto
                            </button>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <Btn type="submit" disabled={solicitar.isPending} className="flex-1 justify-center">
                            {solicitar.isPending ? 'Iniciando...' : <><Play size={16} />Iniciar análisis</>}
                        </Btn>
                        <Btn variant="outline" onClick={() => setModalAnalisis(false)}>Cancelar</Btn>
                    </div>
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
