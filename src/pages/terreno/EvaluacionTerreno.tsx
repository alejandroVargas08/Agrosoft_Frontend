import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Ban, CloudRain, Home, Layers, Leaf, Loader2, Mountain, Sprout, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Card, PageHeader } from '../../components/ui/AgroUI';
import { MapaSatelital } from '../../components/mapa/MapaSatelital';
import { AjustarVista, Circulo, Lineas, Poligono } from '../../components/mapa/FigurasMapa';
import { disenoTerrenoApi } from '../../api/disenoTerreno/disenoTerreno';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { PERMISOS_TERRENO, type AptitudCultivo, type ClaseAptitud, type EtapaEvaluacion, type FuenteObjeto, type ObjetoTerreno, type PerfilTerreno, type SistemaTrazado, type TipoObjeto, type TipoZona, type ZonaExcluida } from '../../types/disenoTerreno/disenoTerreno';

const ETAPAS: Record<EtapaEvaluacion, string> = {
    TOPOGRAFIA: 'Midiendo altitud y pendiente',
    CLIMA_Y_SUELO: 'Consultando clima y suelo',
    COBERTURA: 'Analizando qué hay sobre el terreno',
    APTITUD: 'Calculando la aptitud de cada cultivo',
    DISENO: 'Diseñando la siembra',
};

const CLASES: Record<ClaseAptitud, { texto: string; color: 'success' | 'info' | 'warning' | 'danger' | 'muted'; barra: string }> = {
    ALTA: { texto: 'Aptitud alta', color: 'success', barra: '#10b981' },
    MODERADA: { texto: 'Moderada', color: 'info', barra: '#3b82f6' },
    MARGINAL: { texto: 'Marginal', color: 'warning', barra: '#f59e0b' },
    NO_APTO: { texto: 'No apto', color: 'danger', barra: '#dc2626' },
    SIN_DATOS: { texto: 'Sin datos', color: 'muted', barra: '#9ca3af' },
};

const TRAZADOS: Record<SistemaTrazado, string> = {
    SURCOS_RECTOS: 'Surcos rectos',
    CURVAS_DE_NIVEL: 'Curvas de nivel',
    CURVAS_CON_BARRERAS: 'Curvas de nivel con barreras vivas',
    TERRAZAS: 'Terrazas',
    NO_RECOMENDADO: 'No recomendado para cultivos limpios',
};

const COLOR_SURCOS = '#fbbf24';
const RADIO_PUNTO_M = 4;

const ZONAS: Record<TipoZona, { texto: string; color: string; opacidad: number }> = {
    NO_SEMBRABLE: { texto: 'No se puede sembrar', color: '#dc2626', opacidad: 0.45 },
    YA_SEMBRADO: { texto: 'Ya sembrado', color: '#2563eb', opacidad: 0.4 },
    BOSQUE: { texto: 'Bosque o rastrojo', color: '#166534', opacidad: 0.45 },
    LIBRE: { texto: 'Libre para sembrar', color: '#22c55e', opacidad: 0.15 },
};

const OBJETOS: Record<TipoObjeto, { texto: string; plural: string; color: string }> = {
    CONSTRUCCION: { texto: 'Casa o construcción', plural: 'Casas y construcciones', color: '#ef4444' },
    VIA: { texto: 'Vía o camino', plural: 'Vías y caminos', color: '#f97316' },
    AGUA: { texto: 'Agua', plural: 'Agua (estanques, quebradas)', color: '#0ea5e9' },
    BOSQUE: { texto: 'Bosque', plural: 'Bosques', color: '#15803d' },
    ARBOL: { texto: 'Árboles', plural: 'Árboles', color: '#4ade80' },
};

const ORDEN_OBJETOS: TipoObjeto[] = ['CONSTRUCCION', 'VIA', 'AGUA', 'BOSQUE', 'ARBOL'];

const FUENTES_OBJETO: Record<FuenteObjeto, string> = {
    OSM: 'OpenStreetMap',
    MICROSOFT: 'Microsoft (edificios)',
    IA_DRON: 'IA en las fotos del dron',
};

const fuenteDe = (o: ObjetoTerreno): FuenteObjeto => o.fuente ?? 'OSM';

const CapaObjetos = ({ objetos }: { objetos: ObjetoTerreno[] }) => (
    <>
        {objetos.filter((o) => o.forma === 'POLIGONO').map((o, i) => (
            <Poligono
                key={`p${i}`}
                vertices={o.puntos}
                color={OBJETOS[o.tipo].color}
                opacidad={fuenteDe(o) === 'IA_DRON' ? 0.3 : 0.45}
                grosor={fuenteDe(o) === 'IA_DRON' ? 0.5 : 1.5}
                zIndex={fuenteDe(o) === 'IA_DRON' ? 3 : 4}
            />
        ))}
        {ORDEN_OBJETOS.map((tipo) => {
            const lineas = objetos.filter((o) => o.forma === 'LINEA' && o.tipo === tipo).map((o) => o.puntos);
            return lineas.length > 0 ? <Lineas key={tipo} lineas={lineas} color={OBJETOS[tipo].color} grosor={tipo === 'VIA' ? 5 : 3} opacidad={0.85} /> : null;
        })}
        {objetos.filter((o) => o.forma === 'PUNTO').map((o, i) => (
            <Circulo key={`a${i}`} centro={o.puntos[0]} radioM={Math.max(3, o.anchoM / 2)} color={OBJETOS[o.tipo].color} opacidad={0.7} />
        ))}
    </>
);

const ObjetosCard = ({ objetos, perfil }: { objetos: ObjetoTerreno[]; perfil: PerfilTerreno }) => {
    if (objetos.length === 0) return null;
    const resumen = perfil.resumenObjetos;
    const fuentes = (Object.keys(FUENTES_OBJETO) as FuenteObjeto[])
        .map((f) => ({ fuente: f, cantidad: objetos.filter((o) => fuenteDe(o) === f).length }))
        .filter((f) => f.cantidad > 0);
    return (
        <Card>
            <h3 className="font-semibold text-sm mb-1 flex items-center gap-2"><Home size={14} className="text-red-600" />Casas, vías, agua y árboles del terreno</h3>
            <p className="text-xs text-muted-foreground mb-3">
                Detectado con {fuentes.map((f) => FUENTES_OBJETO[f.fuente]).join(', ')}
                {resumen ? `: ocupan el ${resumen.porcentajeOcupado} % del terreno` : ''}. El diseño de siembra no pasa por estas zonas.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
                {fuentes.map((f) => (
                    <Badge key={f.fuente} color={f.fuente === 'IA_DRON' ? 'info' : 'muted'}>
                        {FUENTES_OBJETO[f.fuente]}: {f.cantidad} {f.fuente === 'IA_DRON' ? (f.cantidad === 1 ? 'zona' : 'zonas') : f.cantidad === 1 ? 'objeto' : 'objetos'}
                    </Badge>
                ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ORDEN_OBJETOS.map((tipo) => {
                    const delTipo = objetos.filter((o) => o.tipo === tipo);
                    if (delTipo.length === 0) return null;
                    const nombres = [...new Set(delTipo.map((o) => o.nombre).filter(Boolean))].slice(0, 3);
                    return (
                        <div key={tipo} className="rounded-lg border border-border p-3">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: OBJETOS[tipo].color }} />
                                {OBJETOS[tipo].plural}
                            </p>
                            <p className="text-lg font-bold">{delTipo.filter((o) => fuenteDe(o) !== 'IA_DRON').length}</p>
                            {delTipo.some((o) => fuenteDe(o) === 'IA_DRON') && (
                                <p className="text-[11px] text-muted-foreground">+ {delTipo.filter((o) => fuenteDe(o) === 'IA_DRON').length} zonas vistas por la IA</p>
                            )}
                            {resumen?.porcentajes[tipo] != null && <p className="text-[11px] text-muted-foreground">{resumen.porcentajes[tipo]} % del terreno</p>}
                            {nombres.length > 0 && <p className="text-[11px] text-muted-foreground truncate">{nombres.join(', ')}</p>}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const ORDEN_ZONAS: TipoZona[] = ['NO_SEMBRABLE', 'YA_SEMBRADO', 'BOSQUE', 'LIBRE'];

const tipoDe = (zona: ZonaExcluida): TipoZona => zona.tipo ?? 'NO_SEMBRABLE';

const fmt = (n: number, decimales = 1) => n.toLocaleString('es-CO', { maximumFractionDigits: decimales });
const ha = (m2: number) => `${fmt(m2 / 10_000, 2)} ha`;

const FUENTE_COBERTURA: Record<string, string> = {
    DRON: 'vuelo de dron',
    SATELITE: 'imagen satelital',
    DRON_Y_SATELITE: 'vuelo de dron + imagen satelital para lo que el dron no cubrió',
    MAPA: 'mapas (OpenStreetMap, Microsoft) y detección con IA',
};

const Dato = ({ icono, titulo, valor, detalle, fuente }: { icono: ReactNode; titulo: string; valor: string; detalle?: string; fuente?: string }) => (
    <div className="flex gap-3 py-2.5 border-b border-border last:border-b-0">
        <div className="p-2 h-fit rounded-lg bg-primary/10 text-primary">{icono}</div>
        <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">{titulo}</p>
            <p className="text-sm font-semibold text-foreground">{valor}</p>
            {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
            {fuente && <p className="text-[10px] text-muted-foreground/80 mt-0.5">Fuente: {fuente}</p>}
        </div>
    </div>
);

const PerfilCard = ({ perfil }: { perfil: PerfilTerreno }) => {
    const { topografia, clima, suelo, cobertura } = perfil;
    return (
        <Card>
            <h3 className="font-semibold text-sm mb-1">Perfil del terreno</h3>
            <p className="text-xs text-muted-foreground mb-2">Área medida: {ha(perfil.areaM2)}</p>
            <Dato
                icono={<Mountain size={16} />}
                titulo="Altitud y pendiente"
                valor={topografia ? `${fmt(topografia.altitudPromedioM, 0)} m s.n.m. · ${fmt(topografia.pendientePct)} % de pendiente` : 'Sin dato'}
                detalle={topografia ? `Entre ${fmt(topografia.altitudMinM, 0)} y ${fmt(topografia.altitudMaxM, 0)} m` : undefined}
                fuente={topografia?.fuente}
            />
            <Dato
                icono={<CloudRain size={16} />}
                titulo="Clima"
                valor={clima ? `${fmt(clima.temperaturaMediaC)} °C promedio · ${fmt(clima.precipitacionAnualMm, 0)} mm/año` : 'Sin dato'}
                detalle={clima ? `Mínimas de ${fmt(clima.temperaturaMinMediaC)} °C, máximas de ${fmt(clima.temperaturaMaxMediaC)} °C` : undefined}
                fuente={clima?.fuente}
            />
            <Dato
                icono={<Layers size={16} />}
                titulo="Suelo"
                valor={suelo ? `pH ${suelo.ph ?? '—'} · ${suelo.textura?.replace('_', ' ').toLowerCase() ?? 'textura sin dato'}` : 'Sin dato'}
                detalle={suelo ? `Arcilla ${suelo.arcillaPct ?? '—'} % · Arena ${suelo.arenaPct ?? '—'} % · Carbono orgánico ${suelo.carbonoOrganicoGKg ?? '—'} g/kg` : undefined}
                fuente={suelo?.fuente}
            />
            <Dato
                icono={<Sprout size={16} />}
                titulo="Qué hay sobre el terreno"
                valor={cobertura ? `${cobertura.porcentajeSembrable} % sembrable` : 'Sin verificar'}
                detalle={
                    cobertura
                        ? [
                            Object.entries(cobertura.porcentajes)
                                .filter(([, pct]) => pct >= 0.5)
                                .sort((a, b) => b[1] - a[1])
                                .map(([tipo, pct]) => `${tipo.replace('_', ' ').toLowerCase()} ${fmt(pct, 0)} %`)
                                .join(' · '),
                            (cobertura.areaVerificadaPct ?? 100) < 100 ? `sin verificar ${100 - (cobertura.areaVerificadaPct ?? 100)} %` : '',
                        ].filter(Boolean).join(' · ')
                        : undefined
                }
                fuente={cobertura ? FUENTE_COBERTURA[cobertura.fuente] ?? cobertura.referencia ?? 'imagen satelital' : undefined}
            />
            {(cobertura?.cultivosExistentes ?? []).length > 0 && (
                <Dato
                    icono={<Leaf size={16} />}
                    titulo="Lo que ya está sembrado"
                    valor={cobertura!.cultivosExistentes!.map((c) => c.nombre).join(', ')}
                    detalle={cobertura!.cultivosExistentes!.map((c) => `${c.nombre}: ${c.capturas} ${c.capturas === 1 ? 'foto' : 'fotos'}`).join(' · ')}
                    fuente="lo que la IA reconoció en las fotos del dron"
                />
            )}
            {perfil.fuentesFallidas.length > 0 && (
                <p className="mt-2 text-xs text-[#E65100]">No se pudo obtener: {perfil.fuentesFallidas.join(', ')}</p>
            )}
        </Card>
    );
};

const ZonasCard = ({ zonas }: { zonas: ZonaExcluida[] }) => {
    const grupos = ORDEN_ZONAS.filter((t) => t !== 'LIBRE')
        .map((tipo) => ({ tipo, zonas: zonas.filter((z) => tipoDe(z) === tipo) }))
        .filter((g) => g.zonas.length > 0);
    const libres = zonas.filter((z) => tipoDe(z) === 'LIBRE').length;
    if (grupos.length === 0 && libres === 0) return null;
    return (
        <Card>
            <h3 className="font-semibold text-sm mb-1 flex items-center gap-2"><Ban size={14} className="text-red-600" />Qué hay en cada parte del terreno</h3>
            <p className="text-xs text-muted-foreground mb-3">
                Cada punto del mapa es el lugar donde el dron tomó una foto. Los surcos del diseño no pasan por las zonas rojas, azules ni verde oscuro.
                {libres > 0 ? ` ${libres} ${libres === 1 ? 'foto muestra' : 'fotos muestran'} terreno libre para sembrar.` : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {grupos.map((g) => (
                    <div key={g.tipo} className="rounded-lg border border-border p-3">
                        <p className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZONAS[g.tipo].color }} />
                            {ZONAS[g.tipo].texto} ({g.zonas.length})
                        </p>
                        <ul className="space-y-1">
                            {g.zonas.map((z, i) => (
                                <li key={i} className="text-[11px] text-muted-foreground">• {z.motivo}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const FilaCultivo = ({ cultivo, activo, onClick }: { cultivo: AptitudCultivo; activo: boolean; onClick: () => void }) => {
    const clase = CLASES[cultivo.clase];
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${activo ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
        >
            <div className="flex items-center gap-2">
                <span className="font-semibold text-sm flex-1">{cultivo.nombre}</span>
                <Badge color={clase.color}>{clase.texto}</Badge>
                <span className="text-sm font-bold w-8 text-right">{cultivo.puntaje}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${cultivo.puntaje}%`, background: clase.barra }} />
            </div>
            {cultivo.limitantes.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                    {cultivo.limitantes.slice(0, 2).map((l) => (
                        <li key={l} className="text-[11px] text-muted-foreground">• {l}</li>
                    ))}
                </ul>
            )}
        </button>
    );
};

const EvaluacionTerreno = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const evaluacionId = Number(id);
    const { puede, cargando } = usePermisos();
    const [codigoElegido, setCodigoElegido] = useState<string | null>(null);
    const [verHuellas, setVerHuellas] = useState(false);
    const [verObjetos, setVerObjetos] = useState(true);

    const { data: evaluacion, error, isLoading } = useQuery({
        queryKey: ['evaluacion-terreno', evaluacionId],
        queryFn: async () => (await disenoTerrenoApi.obtener(evaluacionId)).data,
        enabled: Number.isFinite(evaluacionId),
        refetchInterval: (query) => {
            const estado = query.state.data?.estado;
            return estado === 'PENDIENTE' || estado === 'PROCESANDO' ? 3000 : false;
        },
    });

    const completada = evaluacion?.estado === 'COMPLETADO';
    const codigo = codigoElegido ?? evaluacion?.disenos?.[0]?.cultivoCodigo ?? null;
    const disenoGuardado = evaluacion?.disenos?.find((d) => d.cultivoCodigo === codigo);

    const { data: disenoCalculado, isFetching: calculandoDiseno } = useQuery({
        queryKey: ['diseno-cultivo', evaluacionId, codigo],
        queryFn: async () => (await disenoTerrenoApi.disenarCultivo(evaluacionId, codigo as string)).data.diseno,
        enabled: completada && !!codigo && !disenoGuardado,
    });

    const diseno = disenoGuardado ?? disenoCalculado;
    const zonasMapa = evaluacion?.perfil?.cobertura?.zonas?.length ? evaluacion.perfil.cobertura.zonas : diseno?.zonasExcluidas ?? [];
    const objetosMapa = evaluacion?.perfil?.objetos ?? [];

    if (!cargando && !puede(PERMISOS_TERRENO.VER)) {
        return <Navigate to="/territorio" replace />;
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
                <PageHeader
                    title="Evaluación del terreno"
                    subtitle={evaluacion?.nombre ?? 'Cargando...'}
                    onBack={() => navigate('/territorio')}
                />

                {isLoading && <p className="text-sm text-muted-foreground">Cargando evaluación...</p>}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        {mensajeError(error, 'No se pudo cargar la evaluación')}
                    </div>
                )}

                {evaluacion && (evaluacion.estado === 'PENDIENTE' || evaluacion.estado === 'PROCESANDO') && (
                    <Card className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Loader2 size={16} className="animate-spin text-primary" />
                            {evaluacion.etapa ? ETAPAS[evaluacion.etapa] : 'En cola...'}
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(evaluacion.progreso, 5)}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Puede tardar varios minutos si la IA revisa las fotos del dron. La página se actualiza sola.
                        </p>
                    </Card>
                )}

                {evaluacion?.estado === 'ERROR' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        La evaluación falló: {evaluacion.mensajeError}
                    </div>
                )}

                {evaluacion && completada && evaluacion.perfil && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                            <Card className="lg:col-span-3 p-0 overflow-hidden flex flex-col">
                                <div className="p-3 bg-muted text-[13px] font-semibold flex flex-wrap items-center gap-2">
                                    <TrendingUp size={14} className="text-primary" />
                                    {diseno ? `Diseño para ${diseno.cultivoNombre}` : 'Selecciona un cultivo'}
                                    {diseno && (
                                        <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                                            {TRAZADOS[diseno.sistemaTrazado]}
                                            {diseno.surcosPorLinea > 1 ? ` · cada línea = ${diseno.surcosPorLinea} surcos` : ''}
                                        </span>
                                    )}
                                </div>
                                <MapaSatelital className="flex-1 min-h-120">
                                    <AjustarVista puntos={evaluacion.poligono} />
                                    <Poligono vertices={evaluacion.poligono} color="#ffffff" opacidad={0.08} grosor={2} />
                                    {verHuellas && zonasMapa.map((z, i) => (
                                        <Circulo key={`h${i}`} centro={z.centro} radioM={z.radioM} color={ZONAS[tipoDe(z)].color} opacidad={0.12} />
                                    ))}
                                    {verObjetos && <CapaObjetos objetos={objetosMapa} />}
                                    {diseno && <Lineas lineas={diseno.surcos} color={COLOR_SURCOS} grosor={1} />}
                                    {zonasMapa.map((z, i) => (
                                        <Circulo key={i} centro={z.centro} radioM={RADIO_PUNTO_M} color={ZONAS[tipoDe(z)].color} opacidad={0.95} />
                                    ))}
                                </MapaSatelital>
                                <div className="px-3 py-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ backgroundColor: COLOR_SURCOS }} />Surcos</span>
                                    {ORDEN_ZONAS.filter((t) => zonasMapa.some((z) => tipoDe(z) === t)).map((t) => (
                                        <span key={t} className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZONAS[t].color }} />
                                            {ZONAS[t].texto}
                                        </span>
                                    ))}
                                    {verObjetos && ORDEN_OBJETOS.filter((t) => objetosMapa.some((o) => o.tipo === t)).map((t) => (
                                        <span key={t} className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: OBJETOS[t].color }} />
                                            {OBJETOS[t].texto}
                                        </span>
                                    ))}
                                    {objetosMapa.length > 0 && (
                                        <label className="ml-auto flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={verObjetos} onChange={(e) => setVerObjetos(e.target.checked)} className="accent-[#2D7A3E]" />
                                            Casas, vías y árboles
                                        </label>
                                    )}
                                    {zonasMapa.length > 0 && (
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={verHuellas} onChange={(e) => setVerHuellas(e.target.checked)} className="accent-[#2D7A3E]" />
                                            Ver área que cubre cada foto
                                        </label>
                                    )}
                                </div>
                            </Card>

                            <div className="lg:col-span-2">
                                <PerfilCard perfil={evaluacion.perfil} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card>
                                <h3 className="font-semibold text-sm mb-3">Cultivos según aptitud</h3>
                                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                                    {(evaluacion.ranking ?? []).map((cultivo) => (
                                        <FilaCultivo
                                            key={cultivo.codigo}
                                            cultivo={cultivo}
                                            activo={cultivo.codigo === codigo}
                                            onClick={() => setCodigoElegido(cultivo.codigo)}
                                        />
                                    ))}
                                </div>
                            </Card>

                            <Card>
                                <h3 className="font-semibold text-sm mb-3">Diseño de siembra</h3>
                                {calculandoDiseno && !diseno && <p className="text-sm text-muted-foreground">Calculando diseño...</p>}
                                {diseno && (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Área efectiva</p>
                                                <p className="text-sm font-semibold">{ha(diseno.areaEfectivaM2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Plantas estimadas</p>
                                                <p className="text-sm font-semibold">{fmt(diseno.plantasEstimadas, 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Surcos</p>
                                                <p className="text-sm font-semibold">{fmt(diseno.surcosEstimados, 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Distancia de siembra</p>
                                                <p className="text-sm font-semibold">{diseno.distanciaSurcosM} × {diseno.distanciaPlantasM} m</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Densidad</p>
                                                <p className="text-sm font-semibold">{fmt(diseno.densidadPlantasHa, 0)} plantas/ha</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Caminos y calles</p>
                                                <p className="text-sm font-semibold">{diseno.porcentajeCaminos} %</p>
                                            </div>
                                            {(diseno.porcentajeYaSembrado ?? 0) > 0 && (
                                                <div>
                                                    <p className="text-[11px] text-muted-foreground">Ya sembrado</p>
                                                    <p className="text-sm font-semibold">{diseno.porcentajeYaSembrado} %</p>
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="text-xs font-semibold mb-1">Recomendaciones</h4>
                                        <ul className="space-y-1">
                                            {diseno.recomendaciones.map((r) => (
                                                <li key={r} className="text-xs text-muted-foreground">• {r}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </Card>
                        </div>

                        <ObjetosCard objetos={objetosMapa} perfil={evaluacion.perfil} />

                        <ZonasCard zonas={zonasMapa} />

                        {evaluacion.advertencias.length > 0 && (
                            <Card className="bg-[#FFF3E0] border-[#F16C07]/30">
                                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-[#E65100]">
                                    <AlertTriangle size={14} />Advertencias
                                </h3>
                                <ul className="space-y-1">
                                    {evaluacion.advertencias.map((a) => (
                                        <li key={a} className="text-xs text-[#E65100]">• {a}</li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default EvaluacionTerreno;
