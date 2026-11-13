import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Crop, Edit2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Btn, Input, Modal, Select, StatusBadge } from '../ui/AgroUI';
import { useCultivoDetalle } from '../../hooks/cultivos/useCultivoDetalle';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import RegistrarCosechaModal from './RegistrarCosechaModal';

const GESTIONAR = 'cultivos.gestionar';
const TIPOS_CULTIVO = ['Tomate', 'Maíz', 'Lechuga', 'Papa', 'Cebolla', 'Pimiento', 'Pepino', 'Café', 'Otro'];

const ETIQUETA_ESTADO: Record<string, string> = { activo: 'Activo', finalizado: 'Finalizado', cancelado: 'Cancelado' };
const ETIQUETA_CALIDAD: Record<string, string> = { A: 'Primera', B: 'Segunda', C: 'Tercera' };
const COLOR_CALIDAD: Record<string, string> = {
    A: 'bg-chip-bg text-chip-fg',
    B: 'bg-[#FFF3E0] text-[#F16C07]',
    C: 'bg-red-100 text-red-700',
};
const UNIDAD: Record<string, string> = { kg: 'kg', toneladas: 'Toneladas', unidades: 'Unidades', bultos: 'Bultos', cajas: 'Cajas' };

const pesos = (valor: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);
const numero = (valor: number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(valor || 0);
// Fechas sin hora: llegan a medianoche UTC y en Colombia saldrían un día antes
const fecha = (valor?: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

const EDITAR_VACIO = { nombreCultivo: '', tipoCultivo: '', fechaSiembra: '', fechaFinalizacion: '', subLoteId: '', costoEstimado: '' };

type Pestana = 'Resumen' | 'Cosechas' | 'Actividades';

/** El panel lateral del diseño: se abre sobre la lista de cultivos. */
const PanelCultivo = ({ cultivoId, onClose }: { cultivoId: number; onClose: () => void }) => {
    const navigate = useNavigate();
    const { puede } = usePermisos();
    const puedeGestionar = puede(GESTIONAR);
    const [pestana, setPestana] = useState<Pestana>('Resumen');
    const [cosechaAbierta, setCosechaAbierta] = useState(false);

    const {
        cultivo, lote, cosechas, actividades, metricas, cargando, error,
        sublotes, modalEditar, abrirModalEditar, cerrarModalEditar, editando, errorEdicion, editarCultivo,
    } = useCultivoDetalle(cultivoId);

    const [edicion, setEdicion] = useState(EDITAR_VACIO);
    const campo = (clave: keyof typeof EDITAR_VACIO) => (valor: string) => setEdicion((e) => ({ ...e, [clave]: valor }));

    const sublote = cultivo?.subLoteId ? sublotes.find((s) => s.id === cultivo.subLoteId) : undefined;
    const ubicacion = `${lote?.nombre ?? (cultivo ? 'Lote #' + cultivo.loteId : '—')}${sublote ? ` › ${sublote.nombre}` : ''}`;

    const abrirEdicion = () => {
        if (!cultivo) return;
        setEdicion({
            nombreCultivo: cultivo.nombreCultivo,
            tipoCultivo: cultivo.tipoCultivo,
            fechaSiembra: cultivo.fechaSiembra?.slice(0, 10) ?? '',
            fechaFinalizacion: cultivo.fechaFinalizacion?.slice(0, 10) ?? '',
            subLoteId: cultivo.subLoteId !== null ? String(cultivo.subLoteId) : '',
            costoEstimado: cultivo.costoEstimado != null ? String(cultivo.costoEstimado) : '',
        });
        abrirModalEditar();
    };

    const guardarEdicion = () => {
        if (!cultivo) return;
        // Solo se manda lo que de verdad cambió
        const cambios: Record<string, unknown> = {};
        const e = edicion;
        if (e.nombreCultivo.trim() !== cultivo.nombreCultivo) cambios.nombreCultivo = e.nombreCultivo.trim();
        if (e.tipoCultivo !== cultivo.tipoCultivo) cambios.tipoCultivo = e.tipoCultivo;
        if (e.fechaSiembra && e.fechaSiembra !== (cultivo.fechaSiembra ?? '').slice(0, 10)) cambios.fechaSiembra = e.fechaSiembra;
        if (e.fechaFinalizacion && e.fechaFinalizacion !== (cultivo.fechaFinalizacion ?? '').slice(0, 10)) cambios.fechaFinalizacion = e.fechaFinalizacion;
        const subLoteActual = cultivo.subLoteId !== null ? String(cultivo.subLoteId) : '';
        if (e.subLoteId !== subLoteActual && e.subLoteId !== '') cambios.subLoteId = Number(e.subLoteId);
        if (e.costoEstimado !== '' && Number(e.costoEstimado) !== cultivo.costoEstimado) cambios.costoEstimado = Number(e.costoEstimado);

        if (Object.keys(cambios).length === 0) { cerrarModalEditar(); return; }
        editarCultivo(cambios, () => { cerrarModalEditar(); toast.success('Cultivo actualizado'); });
    };

    // Rendimiento del diseño: ingreso estimado contra lo invertido
    const rendimiento = metricas.retornoPorcentaje !== null && metricas.ingresoEstimado > 0
        ? `${metricas.retornoPorcentaje}%` : '—';
    const costoMostrado = cultivo
        ? cultivo.costoTotal > 0
            ? pesos(cultivo.costoTotal)
            : cultivo.costoEstimado
                ? `${pesos(cultivo.costoEstimado)} (estimado)`
                : pesos(0)
        : '—';

    const cosechasOrdenadas = [...cosechas].sort((a, b) => (b.fechaCosecha ?? '').localeCompare(a.fechaCosecha ?? ''));

    return (
        <div className="fixed inset-0 z-40" onClick={onClose}>
            <div className="absolute inset-0 bg-black/25" />
            <div
                className="absolute inset-y-0 right-0 w-full sm:w-[78%] lg:w-[65%] bg-background border-l border-border flex flex-col shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {cargando || !cultivo ? (
                    <div className="p-5 flex items-start justify-between">
                        <p className="text-sm text-muted-foreground">
                            {cargando ? 'Cargando el cultivo...' : error || 'No se encontró el cultivo.'}
                        </p>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Cerrar">
                            <X size={18} className="text-muted-foreground" />
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Encabezado */}
                        <div className="p-5 border-b border-border bg-card shrink-0">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h2 className="text-lg font-bold text-foreground">{cultivo.nombreCultivo}</h2>
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-chip-bg text-chip-fg">
                                            {ETIQUETA_ESTADO[cultivo.estado] ?? cultivo.estado}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{cultivo.tipoCultivo} · {ubicacion}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                    {puedeGestionar && (
                                        <>
                                            <Btn variant="outline" onClick={abrirEdicion}><Edit2 size={14} />Editar</Btn>
                                            {cultivo.estado === 'activo' && (
                                                <Btn onClick={() => setCosechaAbierta(true)}><Plus size={14} />Registrar cosecha</Btn>
                                            )}
                                        </>
                                    )}
                                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Cerrar">
                                        <X size={18} className="text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Pestañas */}
                        <div className="flex border-b border-border px-5 bg-card shrink-0 overflow-x-auto">
                            {(['Resumen', 'Cosechas', 'Actividades'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setPestana(t)}
                                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                        pestana === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t}{t === 'Cosechas' ? ` (${cosechas.length})` : ''}{t === 'Actividades' ? ` (${actividades.length})` : ''}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {pestana === 'Resumen' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
                                            <p className="text-xs text-muted-foreground mb-1">Total cosechado</p>
                                            <p className="text-2xl font-bold text-primary">{numero(metricas.totalKg)} kg</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {cosechas.length} cosecha{cosechas.length !== 1 ? 's' : ''} registrada{cosechas.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                            <p className="text-xs text-muted-foreground mb-1">Ingreso estimado</p>
                                            <p className="text-2xl font-bold text-emerald-600">
                                                {metricas.ingresoEstimado > 0 ? pesos(metricas.ingresoEstimado) : '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Precio de venta referencial</p>
                                        </div>
                                        <div className="p-4 bg-muted rounded-xl">
                                            <p className="text-xs text-muted-foreground mb-1">Rendimiento</p>
                                            <p className="text-2xl font-bold text-foreground">{rendimiento}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Retorno sobre inversión</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Información del cultivo</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: 'Categoría', value: cultivo.tipoCultivo },
                                                { label: 'Estado', value: ETIQUETA_ESTADO[cultivo.estado] ?? cultivo.estado },
                                                { label: 'Ubicación', value: ubicacion },
                                                { label: 'Costo total', value: costoMostrado },
                                                { label: 'Fecha de siembra', value: fecha(cultivo.fechaSiembra) },
                                                { label: 'Fecha de fin', value: fecha(cultivo.fechaFinalizacion) },
                                                { label: 'Última cosecha', value: metricas.ultimaCosecha ? fecha(metricas.ultimaCosecha) : 'Sin cosechas' },
                                                { label: 'Cosechas registradas', value: String(cosechas.length) },
                                            ].map((item) => (
                                                <div key={item.label} className="p-3 bg-muted rounded-xl">
                                                    <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                                                    <p className="text-sm font-semibold text-foreground">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {pestana === 'Cosechas' && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold text-foreground">Cosechas registradas</p>
                                        {puedeGestionar && cultivo.estado === 'activo' && (
                                            <Btn onClick={() => setCosechaAbierta(true)}><Plus size={14} />Registrar cosecha</Btn>
                                        )}
                                    </div>
                                    {cosechas.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-xl border border-border border-dashed">
                                            <Crop size={36} className="text-muted-foreground/40 mb-3" />
                                            <p className="text-sm font-semibold text-foreground mb-1">Sin cosechas registradas</p>
                                            <p className="text-xs text-muted-foreground mb-3">Este cultivo todavía no tiene registros de cosecha.</p>
                                            {puedeGestionar && cultivo.estado === 'activo' && (
                                                <Btn onClick={() => setCosechaAbierta(true)}><Plus size={14} />Registrar primera cosecha</Btn>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                                            <table className="w-full text-sm min-w-[580px]">
                                                <thead>
                                                    <tr className="bg-muted border-b border-border">
                                                        {['Fecha', 'Cantidad', 'Unidad', 'Calidad', 'Responsable', 'Destino', 'Observaciones'].map((col) => (
                                                            <th key={col} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{col}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cosechasOrdenadas.map((h, i) => (
                                                        <tr key={h.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}>
                                                            <td className="px-3 py-2.5 text-xs whitespace-nowrap">{fecha(h.fechaCosecha)}</td>
                                                            <td className="px-3 py-2.5 text-xs font-bold">{numero(h.cantidad ?? h.cantidadKg)}</td>
                                                            <td className="px-3 py-2.5 text-xs text-muted-foreground">{UNIDAD[h.unidad ?? 'kg'] ?? h.unidad}</td>
                                                            <td className="px-3 py-2.5">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${COLOR_CALIDAD[h.calidad] ?? 'bg-muted text-muted-foreground'}`}>
                                                                    {ETIQUETA_CALIDAD[h.calidad] ?? h.calidad}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-xs text-muted-foreground">{h.responsable || '—'}</td>
                                                            <td className="px-3 py-2.5 text-xs text-muted-foreground">{h.destino || '—'}</td>
                                                            <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[160px] truncate">{h.observaciones || '—'}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-primary/5 border-t-2 border-primary/20">
                                                        <td className="px-3 py-2.5 text-xs font-bold text-primary">Total</td>
                                                        <td className="px-3 py-2.5 text-xs font-bold text-primary">{numero(metricas.totalKg)}</td>
                                                        <td className="px-3 py-2.5 text-xs text-primary">kg</td>
                                                        <td colSpan={4} />
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {pestana === 'Actividades' && (
                                <div className="space-y-2">
                                    {actividades.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-xl border border-border border-dashed">
                                            <ClipboardList size={32} className="text-muted-foreground/40 mb-3" />
                                            <p className="text-sm font-semibold text-foreground">Sin actividades asociadas</p>
                                            <p className="text-xs text-muted-foreground mt-1">No hay actividades registradas para este cultivo.</p>
                                        </div>
                                    ) : actividades.map((a) => (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={() => navigate('/actividades/' + a.id, { state: { actividad: a } })}
                                            className="w-full flex items-center justify-between p-3 bg-muted rounded-xl gap-3 text-left hover:bg-muted/70 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-1.5 bg-icon-bg rounded-lg shrink-0"><ClipboardList size={14} className="text-primary" /></div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground">{a.tipo}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {a.subtipo ? a.subtipo + ' · ' : ''}{fecha(a.fecha)}
                                                    </p>
                                                </div>
                                            </div>
                                            <StatusBadge status={a.estado} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Los modales van fuera del panel para que el clic no lo cierre */}
            <div onClick={(e) => e.stopPropagation()}>
                <RegistrarCosechaModal open={cosechaAbierta} onClose={() => setCosechaAbierta(false)} cultivoFijo={cultivo} />

                <Modal open={modalEditar} onClose={cerrarModalEditar} title="Editar cultivo">
                    <div className="space-y-3">
                        <Input label="Nombre del cultivo" value={edicion.nombreCultivo} onChange={campo('nombreCultivo')} required />
                        <Select
                            label="Tipo de cultivo"
                            value={edicion.tipoCultivo}
                            onChange={campo('tipoCultivo')}
                            options={TIPOS_CULTIVO.includes(edicion.tipoCultivo) || !edicion.tipoCultivo ? TIPOS_CULTIVO : [edicion.tipoCultivo, ...TIPOS_CULTIVO]}
                        />
                        {sublotes.length > 0 && (
                            <Select
                                label="Sublote (opcional)"
                                value={edicion.subLoteId}
                                onChange={campo('subLoteId')}
                                options={[{ value: '', label: 'Sin sublote' }, ...sublotes.map((s) => ({ value: String(s.id), label: s.nombre }))]}
                            />
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Fecha siembra" value={edicion.fechaSiembra} onChange={campo('fechaSiembra')} type="date" />
                            <Input label="Fecha finalización" value={edicion.fechaFinalizacion} onChange={campo('fechaFinalizacion')} type="date" />
                        </div>
                        <Input label="Costo total estimado (COP)" value={edicion.costoEstimado} onChange={campo('costoEstimado')} type="number" placeholder="2800000" />
                        <p className="text-xs text-muted-foreground">
                            El lote no se puede cambiar: las cosechas y las actividades de este cultivo apuntan a {lote ? lote.nombre : 'el lote actual'}.
                        </p>
                        {errorEdicion && <p className="text-sm text-red-600">{errorEdicion}</p>}
                        <div className="flex gap-3 pt-2">
                            <Btn
                                onClick={guardarEdicion}
                                disabled={editando || !edicion.nombreCultivo.trim() || !edicion.tipoCultivo}
                                className="flex-1 justify-center"
                            >
                                {editando ? 'Guardando...' : 'Guardar cambios'}
                            </Btn>
                            <Btn variant="outline" onClick={cerrarModalEditar}>Cancelar</Btn>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default PanelCultivo;
