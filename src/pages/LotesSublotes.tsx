import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapIcon, Plus } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, PageHeader, StatusBadge, Tab } from '../components/ui/AgroUI';
import { useTerritorio } from '../hooks/useTerritorio';
import type { Lote, Punto, SubLote } from '../types/territorio';
import { usePermisos } from '../hooks/permisos/usePermisos';

// Colores de los polígonos (se asignan en orden)
const PALETA = ['#2d7a3e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

// Tamaño de cada mapa (SVG)
const ANCHO = 280;
const ALTO = 200;

const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });
const fmtM2 = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 });

/**
 * Proyecta lat/lng al viewBox del SVG, encuadrando los puntos que se le pasen.
 * El lote y sus sublotes comparten la misma proyección para que encajen.
 */
function crearProyeccion(puntos: Punto[]) {
    if (puntos.length === 0) {
        return (_p: Punto) => ({ x: ANCHO / 2, y: ALTO / 2 });
    }
    const lats = puntos.map((p) => p.lat);
    const lngs = puntos.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const rangoLng = maxLng - minLng || 0.0001;
    const rangoLat = maxLat - minLat || 0.0001;
    const escala = Math.min((ANCHO - 40) / rangoLng, (ALTO - 40) / rangoLat);
    const offX = 20 + (ANCHO - 40 - rangoLng * escala) / 2;
    const offY = 20 + (ALTO - 40 - rangoLat * escala) / 2;
    return (p: Punto) => ({
        x: offX + (p.lng - minLng) * escala,
        y: offY + (maxLat - p.lat) * escala, // la latitud crece hacia arriba
    });
}

const puntosSvg = (vertices: Punto[], proyectar: (p: Punto) => { x: number; y: number }) =>
    vertices.map(proyectar).map((q) => `${q.x},${q.y}`).join(' ');

const centro = (vertices: Punto[], proyectar: (p: Punto) => { x: number; y: number }) => {
    const pts = vertices.map(proyectar);
    return {
        x: pts.reduce((a, q) => a + q.x, 0) / pts.length,
        y: pts.reduce((a, q) => a + q.y, 0) / pts.length,
    };
};

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

    // El lote y sus sublotes se encuadran juntos para que no se salgan del marco
    const proyectar = crearProyeccion([
        ...(loteActivo?.vertices ?? []),
        ...hijos.flatMap((s) => s.vertices ?? []),
    ]);

    const accionNuevo = puede('lotes.gestionar') ? (
        <Btn onClick={() => navigate('/territorio/nuevo')}><Plus size={16} />Nuevo Lote</Btn>
    ) : undefined;

    const columnas = Math.min(Math.max(hijos.length, 1), 3);
    const anchoCelda = ANCHO / columnas;
    const altoCelda = ALTO / Math.ceil(Math.max(hijos.length, 1) / columnas);

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
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
                                {/* Selector de lote */}
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

                                {/* Los dos mapas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Izquierda: el lote completo con sus sublotes encima */}
                                    <Card className="p-0 overflow-hidden">
                                        <div className="p-3 bg-muted text-[13px] font-semibold flex items-center gap-2">
                                            <MapIcon size={13} className="text-primary" />Lote: {loteActivo?.nombre}
                                            <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                                                {fmt(loteActivo?.areaHa ?? 0)} ha{hijos.length > 0 ? ' · Haz clic en un sublote' : ''}
                                            </span>
                                        </div>
                                        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" style={{ background: '#e8f5e9' }}>
                                            <defs>
                                                <pattern id="gridA" width="20" height="20" patternUnits="userSpaceOnUse">
                                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#c8e6c9" strokeWidth="0.5" />
                                                </pattern>
                                            </defs>
                                            <rect width={ANCHO} height={ALTO} fill="url(#gridA)" />
                                            {loteActivo && (loteActivo.vertices?.length ?? 0) >= 3 && (
                                                <polygon
                                                    points={puntosSvg(loteActivo.vertices, proyectar)}
                                                    fill={colorLote + '25'}
                                                    stroke={colorLote}
                                                    strokeWidth={2}
                                                />
                                            )}
                                            {hijos.filter((s) => (s.vertices?.length ?? 0) >= 3).map((s, i) => {
                                                const col = PALETA[(i + 1) % PALETA.length];
                                                const resaltado = subloteResaltado === s.id;
                                                const c = centro(s.vertices, proyectar);
                                                return (
                                                    <g
                                                        key={s.id}
                                                        onClick={() => setSubloteResaltado(resaltado ? null : s.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <polygon
                                                            points={puntosSvg(s.vertices, proyectar)}
                                                            fill={col + (resaltado ? 'bb' : '55')}
                                                            stroke={col}
                                                            strokeWidth={resaltado ? 3 : 1.5}
                                                            strokeDasharray="5,3"
                                                        />
                                                        <text
                                                            x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle"
                                                            fontSize="8" fontWeight="600" fill={col}
                                                        >
                                                            {s.nombre.split(' ').slice(0, 2).join(' ')}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </Card>

                                    {/* Derecha: cada sublote en su propia celda */}
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
                                                {/* Leyenda de colores */}
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

                                {/* Fila de datos debajo de los mapas */}
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
