import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Map as MapIcon, Pencil, Plus, Sprout } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, PageHeader, StatusBadge, Tab } from '../components/ui/AgroUI';
import { useTerritorio } from '../hooks/useTerritorio';
import type { Lote, SubLote } from '../types/territorio';
import { MapaSatelital } from '../components/mapa/MapaSatelital';
import { AjustarVista, Poligono } from '../components/mapa/FigurasMapa';
import { usePermisos } from '../hooks/permisos/usePermisos';
import { disenoTerrenoApi } from '../api/disenoTerreno/disenoTerreno';
import { mensajeError } from '../api/errores/errores';
import { PERMISOS_TERRENO } from '../types/disenoTerreno/disenoTerreno';

const PALETA = ['#2d7a3e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

const ANCHO = 280;
const ALTO = 200;

const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });
const fmtM2 = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 });

const LotesSublotes = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('Mapa');
    const [loteSeleccionadoId, setLoteSeleccionadoId] = useState<string>('');
    const [subloteResaltado, setSubloteResaltado] = useState<number | null>(null);
    const { lotes, sublotes, loading, error } = useTerritorio();
    const { puede } = usePermisos();

    const loteActivo: Lote | undefined =
        lotes.find((l) => String(l.id) === loteSeleccionadoId) ?? lotes[0];
    const hijos: SubLote[] = loteActivo ? sublotes.filter((s) => s.loteId === loteActivo.id) : [];

    const colorLote = loteActivo
        ? PALETA[lotes.findIndex((l) => l.id === loteActivo.id) % PALETA.length]
        : PALETA[0];

    const puntosVista = [
        ...(loteActivo?.vertices ?? []),
        ...hijos.flatMap((s) => s.vertices ?? []),
    ];

    const subloteActivo = hijos.find((s) => s.id === subloteResaltado);
    const puedeEvaluar = puede(PERMISOS_TERRENO.EVALUAR);
    const puedeVerEvaluaciones = puede(PERMISOS_TERRENO.VER);

    const { data: evaluaciones = [] } = useQuery({
        queryKey: ['evaluaciones-terreno', loteActivo?.id],
        queryFn: async () => (await disenoTerrenoApi.listar(loteActivo?.id)).data,
        enabled: !!loteActivo && puedeVerEvaluaciones,
    });

    const evaluarMutation = useMutation({
        mutationFn: async () => {
            if (!loteActivo) throw new Error('Selecciona un lote');
            const solicitud = subloteActivo
                ? { poligono: subloteActivo.vertices, nombre: `${loteActivo.nombre} / ${subloteActivo.nombre}` }
                : { loteId: loteActivo.id };
            return (await disenoTerrenoApi.solicitar(solicitud)).data;
        },
        onSuccess: (evaluacion) => navigate(`/territorio/evaluacion/${evaluacion.id}`),
    });

    const accionNuevo = puede('lotes.gestionar') ? (
        <Btn onClick={() => navigate('/territorio/nuevo')}><Plus size={16} />Nuevo Lote</Btn>
    ) : undefined;

    const columnas = Math.min(Math.max(hijos.length, 1), 3);
    const anchoCelda = ANCHO / columnas;
    const altoCelda = ALTO / Math.ceil(Math.max(hijos.length, 1) / columnas);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader title="Lotes y Sublotes" subtitle="Georreferenciación de la finca" action={accionNuevo} />

                {loading && <p className="text-sm text-muted-foreground">Cargando lotes...</p>}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
                )}

                {!loading && !error && lotes.length === 0 ? (
                    <EmptyState icon={MapIcon} title="Sin lotes" description="Registra el primer lote de la finca" action={accionNuevo} />
                ) : (
                    <>
                        <Tab tabs={['Mapa', 'Lista']} active={tab} onChange={setTab} />

                        {tab === 'Mapa' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <MapIcon size={16} className="text-primary shrink-0" />
                                    <select
                                        value={loteSeleccionadoId || String(lotes[0]?.id ?? '')}
                                        onChange={(e) => { setLoteSeleccionadoId(e.target.value); setSubloteResaltado(null); }}
                                        className="flex-1 sm:flex-none sm:w-64 px-3 py-2 rounded-lg border border-border bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        {lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                                    </select>
                                    {loteActivo && <StatusBadge status={loteActivo.estado} />}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="p-0 overflow-hidden flex flex-col">
                                        <div className="p-3 bg-muted text-[13px] font-semibold flex items-center gap-2">
                                            <MapIcon size={13} className="text-primary" />Lote: {loteActivo?.nombre}
                                            <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                                                {fmt(loteActivo?.areaHa ?? 0)} ha{hijos.length > 0 ? ' · Haz clic en un sublote' : ''}
                                            </span>
                                        </div>
                                        <MapaSatelital className="flex-1 min-h-80">
                                            <AjustarVista puntos={puntosVista} />
                                            {lotes
                                                .filter((l) => l.id !== loteActivo?.id && (l.vertices?.length ?? 0) >= 3)
                                                .map((l) => (
                                                    <Poligono
                                                        key={l.id}
                                                        vertices={l.vertices}
                                                        color="#ffffff"
                                                        opacidad={0.08}
                                                        grosor={1}
                                                        onClick={() => { setLoteSeleccionadoId(String(l.id)); setSubloteResaltado(null); }}
                                                    />
                                                ))}
                                            {loteActivo && (loteActivo.vertices?.length ?? 0) >= 3 && (
                                                <Poligono vertices={loteActivo.vertices} color={colorLote} opacidad={0.2} grosor={3} zIndex={2} />
                                            )}
                                            {hijos.filter((s) => (s.vertices?.length ?? 0) >= 3).map((s, i) => {
                                                const resaltado = subloteResaltado === s.id;
                                                return (
                                                    <Poligono
                                                        key={s.id}
                                                        vertices={s.vertices}
                                                        color={PALETA[(i + 1) % PALETA.length]}
                                                        opacidad={resaltado ? 0.6 : 0.3}
                                                        grosor={resaltado ? 3 : 1.5}
                                                        zIndex={3}
                                                        onClick={() => setSubloteResaltado(resaltado ? null : s.id)}
                                                    />
                                                );
                                            })}
                                        </MapaSatelital>
                                    </Card>

                                    <Card className="p-0 overflow-hidden">
                                        <div className="p-3 bg-muted text-[13px] font-semibold">Sublotes de {loteActivo?.nombre}</div>
                                        {hijos.length === 0 ? (
                                            <p className="text-xs text-muted-foreground p-4 text-center">
                                                Este lote no tiene sublotes registrados.
                                            </p>
                                        ) : (
                                            <>
                                                <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" style={{ background: '#e8f5e9' }}>
                                                    <defs>
                                                        <pattern id="gridB" width="20" height="20" patternUnits="userSpaceOnUse">
                                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#c8e6c9" strokeWidth="0.5" />
                                                        </pattern>
                                                    </defs>
                                                    <rect width={ANCHO} height={ALTO} fill="url(#gridB)" />
                                                    {hijos.map((s, i) => {
                                                        const col = PALETA[(i + 1) % PALETA.length];
                                                        const col_ = i % columnas;
                                                        const fil = Math.floor(i / columnas);
                                                        const cx = col_ * anchoCelda + anchoCelda / 2;
                                                        const cy = fil * altoCelda + altoCelda / 2;
                                                        const resaltado = subloteResaltado === s.id;
                                                        return (
                                                            <g
                                                                key={s.id}
                                                                onClick={() => setSubloteResaltado(resaltado ? null : s.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <rect
                                                                    x={col_ * anchoCelda + 6} y={fil * altoCelda + 6}
                                                                    width={anchoCelda - 12} height={altoCelda - 12} rx="6"
                                                                    fill={col + (resaltado ? 'cc' : '55')}
                                                                    stroke={col}
                                                                    strokeWidth={resaltado ? 3 : 1.5}
                                                                    strokeDasharray={resaltado ? undefined : '5,3'}
                                                                />
                                                                <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill={col}>
                                                                    {s.nombre}
                                                                </text>
                                                                <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill={col}>
                                                                    {fmt(s.areaHa)} ha
                                                                </text>
                                                            </g>
                                                        );
                                                    })}
                                                </svg>
                                                <div className="p-2 flex flex-wrap gap-2 border-t border-border">
                                                    {hijos.map((s, i) => (
                                                        <div key={s.id} className="flex items-center gap-1 text-[11px]">
                                                            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PALETA[(i + 1) % PALETA.length] }} />
                                                            <span>{s.nombre}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </Card>
                                </div>

                                {loteActivo && (
                                    <Card className="p-3">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Nombre</p>
                                                <p className="text-sm font-semibold">{loteActivo.nombre}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Área</p>
                                                <p className="text-sm font-semibold">{fmtM2(loteActivo.areaM2)} m² / {fmt(loteActivo.areaHa)} ha</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Estado</p>
                                                <StatusBadge status={loteActivo.estado} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Sublotes</p>
                                                <p className="text-sm font-semibold">{hijos.length}</p>
                                            </div>
                                        </div>
                                        {loteActivo.descripcion && (
                                            <p className="text-xs text-muted-foreground mt-2">{loteActivo.descripcion}</p>
                                        )}
                                        {puede('lotes.gestionar') && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Btn size="sm" variant="outline" onClick={() => navigate(`/territorio/editar/lote/${loteActivo.id}`)}>
                                                    <Pencil size={14} />Editar lote
                                                </Btn>
                                                {subloteActivo && (
                                                    <Btn size="sm" variant="outline" onClick={() => navigate(`/territorio/editar/sublote/${subloteActivo.id}`)}>
                                                        <Pencil size={14} />Editar sublote {subloteActivo.nombre}
                                                    </Btn>
                                                )}
                                            </div>
                                        )}
                                        {(puedeEvaluar || puedeVerEvaluaciones) && (
                                            <div className="mt-3 pt-3 border-t border-border space-y-2">
                                                {puedeEvaluar && (
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <Btn size="sm" onClick={() => evaluarMutation.mutate()} disabled={evaluarMutation.isPending}>
                                                            <Sprout size={14} />
                                                            {evaluarMutation.isPending
                                                                ? 'Enviando...'
                                                                : subloteActivo ? `Evaluar sublote ${subloteActivo.nombre}` : 'Evaluar terreno'}
                                                        </Btn>
                                                        <span className="text-xs text-muted-foreground">
                                                            Recomienda qué sembrar según altitud, clima, suelo y lo que hay sobre el terreno.
                                                        </span>
                                                    </div>
                                                )}
                                                {evaluarMutation.error && (
                                                    <p className="text-xs text-red-700">{mensajeError(evaluarMutation.error, 'No se pudo iniciar la evaluación')}</p>
                                                )}
                                                {puedeVerEvaluaciones && evaluaciones.length > 0 && (
                                                    <div>
                                                        <p className="text-[11px] text-muted-foreground mb-1">Evaluaciones anteriores</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {evaluaciones.slice(0, 5).map((e) => (
                                                                <button
                                                                    key={e.id}
                                                                    type="button"
                                                                    onClick={() => navigate(`/territorio/evaluacion/${e.id}`)}
                                                                    className="px-2.5 py-1 rounded-lg border border-border text-xs hover:bg-muted"
                                                                >
                                                                    {new Date(e.creadoEn).toLocaleDateString('es-CO')}
                                                                    {' · '}
                                                                    {e.mejorCultivo ? `${e.mejorCultivo.nombre} (${e.mejorCultivo.puntaje})` : e.estado.toLowerCase()}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                )}
                            </div>
                        )}

                        {tab === 'Lista' && (
                            <div className="space-y-3">
                                {lotes.map((l, li) => {
                                    const sub = sublotes.filter((s) => s.loteId === l.id);
                                    const col = PALETA[li % PALETA.length];
                                    return (
                                        <div key={l.id} className="bg-card border border-border rounded-xl overflow-hidden">
                                            <div
                                                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => { setTab('Mapa'); setLoteSeleccionadoId(String(l.id)); setSubloteResaltado(null); }}
                                            >
                                                <div className="p-1.5 rounded-lg" style={{ background: col + '20' }}>
                                                    <MapIcon size={14} style={{ color: col }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-[14px] text-foreground">{l.nombre}</p>
                                                    <p className="text-[12px] text-muted-foreground">
                                                        {l.descripcion ? `${l.descripcion} · ` : ''}{fmt(l.areaHa)} ha
                                                    </p>
                                                </div>
                                                <StatusBadge status={l.estado} />
                                            </div>
                                            {sub.length > 0 && (
                                                <div className="border-t border-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-2 bg-muted/30">
                                                    {sub.map((s, si) => (
                                                        <div key={s.id} className="flex items-center gap-2 p-2 bg-white border border-border rounded-lg">
                                                            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: PALETA[(si + 1) % PALETA.length] }} />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[12px] font-semibold text-foreground truncate">{s.nombre}</p>
                                                                <p className="text-[11px] text-muted-foreground">{fmt(s.areaHa)} ha</p>
                                                            </div>
                                                            <StatusBadge status={s.estado} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default LotesSublotes;