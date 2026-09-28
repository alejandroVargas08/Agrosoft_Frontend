import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapIcon } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, PageHeader, StatusBadge, Tab } from '../components/ui/AgroUI';
import { useTerritorio } from '../hooks/useTerritorio';
import type { Lote, Punto, SubLote } from '../types/territorio';

// Colores de los polígonos (se asignan en orden)
const PALETA = ['#2d7a3e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#ec4899'];

// Tamaño del mapa (SVG)
const ANCHO = 320;
const ALTO = 300;
const MARGEN = 20;

// Un elemento del mapa: puede ser un lote o un sublote
interface Parcela {
    key: string;               // 'lote-1' o 'sub-3'
    tipo: 'plot' | 'subplot';
    nombre: string;
    color: string;
    vertices: Punto[];
    lote?: Lote;
    sublote?: SubLote;
}

const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });

// Convierte coordenadas lat/lng a posiciones x/y dentro del SVG
function crearProyeccion(puntos: Punto[]) {
    if (puntos.length === 0) return () => ({ x: ANCHO / 2, y: ALTO / 2 });
    const lats = puntos.map((p) => p.lat);
    const lngs = puntos.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const rangoLng = maxLng - minLng || 0.0001;
    const rangoLat = maxLat - minLat || 0.0001;
    const escala = Math.min((ANCHO - MARGEN * 2) / rangoLng, (ALTO - MARGEN * 2) / rangoLat);
    // Centrar el dibujo en el mapa
    const offX = (ANCHO - rangoLng * escala) / 2;
    const offY = (ALTO - rangoLat * escala) / 2;
    return (p: Punto) => ({
        x: offX + (p.lng - minLng) * escala,
        y: offY + (maxLat - p.lat) * escala, // la latitud crece hacia arriba
    });
}

const LotesSublotes = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('Mapa');
    const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
    const { lotes, sublotes, loading, error } = useTerritorio();

    // Lotes primero y luego sublotes, para que los sublotes queden dibujados encima
    const parcelas: Parcela[] = [
        ...lotes.map((l, i) => ({
            key: `lote-${l.id}`, tipo: 'plot' as const, nombre: l.nombre,
            color: PALETA[i % PALETA.length], vertices: l.vertices ?? [], lote: l,
        })),
        ...sublotes.map((s, i) => ({
            key: `sub-${s.id}`, tipo: 'subplot' as const, nombre: s.nombre,
            color: PALETA[(lotes.length + i) % PALETA.length], vertices: s.vertices ?? [], sublote: s,
        })),
    ];

    const proyectar = crearProyeccion(parcelas.flatMap((p) => p.vertices));
    const seleccionada = parcelas.find((p) => p.key === selectedPlot);

    const accionNuevo = (
        <Btn onClick={() => navigate('/territorio/nuevo')}><Plus size={16} />Nuevo Lote</Btn>
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
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

                        {tab === 'Mapa' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Mapa */}
                                <div className="lg:col-span-2">
                                    <Card className="p-0 overflow-hidden">
                                        <div className="p-3 bg-muted flex items-center gap-2">
                                            <MapIcon size={16} className="text-primary" />
                                            <span className="text-sm font-semibold">Mapa de la finca</span>
                                            <Badge color="info">Vista esquemática</Badge>
                                        </div>
                                        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" style={{ background: '#e8f5e9' }}>
                                            <defs>
                                                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#c8e6c9" strokeWidth="0.5" />
                                                </pattern>
                                            </defs>
                                            <rect width={ANCHO} height={ALTO} fill="url(#grid)" />
                                            {parcelas.filter((p) => p.vertices.length >= 3).map((p) => {
                                                const pts = p.vertices.map(proyectar);
                                                const puntosSvg = pts.map((q) => `${q.x},${q.y}`).join(' ');
                                                const cx = pts.reduce((a, q) => a + q.x, 0) / pts.length;
                                                const cy = pts.reduce((a, q) => a + q.y, 0) / pts.length;
                                                const isSelected = selectedPlot === p.key;
                                                return (
                                                    <g key={p.key} onClick={() => setSelectedPlot(p.key)} className="cursor-pointer">
                                                        <polygon
                                                            points={puntosSvg}
                                                            fill={p.color + (p.tipo === 'subplot' ? '60' : '30')}
                                                            stroke={p.color}
                                                            strokeWidth={isSelected ? 3 : 2}
                                                            strokeDasharray={p.tipo === 'subplot' ? '5,3' : undefined}
                                                        />
                                                        <text
                                                            x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                                                            fontSize={p.tipo === 'subplot' ? 8 : 10} fontWeight="600" fill={p.color}
                                                        >
                                                            {p.nombre.split(' ')[0]}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                            <text x="10" y="280" fontSize="9" fill="#666">N ↑</text>
                                            <text x="10" y="291" fontSize="8" fill="#999">Escala aproximada</text>
                                        </svg>
                                        <div className="p-3 flex flex-wrap gap-2">
                                            {parcelas.map((p) => (
                                                <button
                                                    key={p.key}
                                                    onClick={() => setSelectedPlot(p.key === selectedPlot ? null : p.key)}
                                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all ${selectedPlot === p.key ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                                                    style={{ background: p.color + '20', color: p.color }}
                                                >
                                                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                                    {p.nombre}
                                                </button>
                                            ))}
                                        </div>
                                    </Card>
                                </div>

                                {/* Detalle del lote seleccionado */}
                                <div className="space-y-3">
                                    {seleccionada ? (
                                        <DetalleParcela parcela={seleccionada} lotes={lotes} sublotes={sublotes} />
                                    ) : (
                                        <Card>
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Selecciona un lote en el mapa para ver sus detalles
                                            </p>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Lotes principales</h3>
                                {lotes.map((l) => {
                                    const hijos = sublotes.filter((s) => s.loteId === l.id);
                                    return (
                                        <Card key={l.id} onClick={() => { setTab('Mapa'); setSelectedPlot(`lote-${l.id}`); }}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg"><MapIcon size={18} className="text-primary" /></div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{l.nombre}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {l.descripcion ? `${l.descripcion} · ` : ''}{fmt(l.areaHa)} ha
                                                        </p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={l.estado} />
                                            </div>
                                            {hijos.length > 0 && (
                                                <div className="mt-2 pl-11">
                                                    <p className="text-xs text-muted-foreground mb-1">Sublotes:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {hijos.map((s) => <Badge key={s.id} color="info">{s.nombre}</Badge>)}
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
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

// Panel derecho: información del lote o sublote seleccionado
function DetalleParcela({ parcela, lotes, sublotes }: { parcela: Parcela; lotes: Lote[]; sublotes: SubLote[] }) {
    const datos = parcela.lote ?? parcela.sublote;
    if (!datos) return null;
    const hijos = parcela.lote ? sublotes.filter((s) => s.loteId === parcela.lote!.id) : [];
    const padre = parcela.sublote ? lotes.find((l) => l.id === parcela.sublote!.loteId) : undefined;

    return (
        <Card>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{parcela.nombre}</h3>
                <StatusBadge status={parcela.tipo} />
            </div>
            <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Área</span>
                    <span className="font-medium">{fmt(datos.areaM2)} m² / {fmt(datos.areaHa)} ha</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado</span>
                    <StatusBadge status={datos.estado} />
                </div>
                {padre && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Lote padre</span>
                        <span className="font-medium">{padre.nombre}</span>
                    </div>
                )}
            </div>
            {datos.descripcion && <p className="text-xs text-muted-foreground mb-3">{datos.descripcion}</p>}
            {hijos.length > 0 && (
                <>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Sublotes ({hijos.length})</p>
                    {hijos.map((c) => (
                        <div key={c.id} className="text-xs p-1.5 bg-muted rounded-lg mb-1">{c.nombre} · {fmt(c.areaHa)} ha</div>
                    ))}
                </>
            )}
        </Card>
    );
}

export default LotesSublotes;