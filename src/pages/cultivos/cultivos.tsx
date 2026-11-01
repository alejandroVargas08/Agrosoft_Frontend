import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Crop, Leaf, MapPin, Plus, Scale, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, EmptyState, Input, Modal, PageHeader, Select, StatusBadge } from '../../components/ui/AgroUI';
import { useCultivosConCosechas } from '../../hooks/cultivos/useCultivosConCosechas';
import { useCultivoForm } from '../../hooks/cultivos/useCultivosForm';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import type { Lote, SubLote } from '../../types/territorio';

const GESTIONAR = 'cultivos.gestionar';

const numero = (valor: number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

const fecha = (valor?: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Colores por tipo de cultivo, tal cual el diseño
const FONDO_TIPO: Record<string, string> = {
    Tomate: 'bg-red-100', 'Maíz': 'bg-blue-100', Lechuga: 'bg-icon-bg',
    'Café': 'bg-icon-bg', Cebolla: 'bg-purple-100',
};
const ICONO_TIPO: Record<string, string> = {
    Tomate: 'text-red-500', 'Maíz': 'text-blue-600', Lechuga: 'text-primary',
    'Café': 'text-primary', Cebolla: 'text-purple-500',
};

const ETIQUETA_CALIDAD: Record<string, string> = { A: 'Primera', B: 'Segunda', C: 'Tercera' };
const COLOR_CALIDAD: Record<string, string> = {
    A: 'bg-chip-bg text-chip-fg',
    B: 'bg-[#FFF3E0] text-[#F16C07]',
    C: 'bg-red-100 text-red-700',
};

type Pestana = 'Cultivo' | 'Cosecha';

const Cultivos = () => {
    const navigate = useNavigate();
    const { puede } = usePermisos();
    const [pestana, setPestana] = useState<Pestana>('Cultivo');
    const [filtroLote, setFiltroLote] = useState('');
    const [modalNuevo, setModalNuevo] = useState(false);
    const [modalCosecha, setModalCosecha] = useState(false);
    const [cultivoCosecha, setCultivoCosecha] = useState('');

    const {
        cultivos, cosechas, lotes, cargando, error,
        finalizar, finalizando, eliminar, eliminando,
    } = useCultivosConCosechas(filtroLote ? Number(filtroLote) : undefined);

    const {
        form, lotes: lotesForm, sublotes, handleFormChange, handleCreateSubmit, creando, errorForm,
    } = useCultivoForm({
        isModalOpen: modalNuevo,
        onSucces: () => setModalNuevo(false),
    });

    // El nombre del cultivo de cada cosecha, para la tabla
    const nombrePorCultivo = useMemo(
        () => new Map(cultivos.map((c) => [c.id, { nombre: c.nombreCultivo, tipo: c.tipoCultivo }])),
        [cultivos],
    );

    const cosechasOrdenadas = useMemo(
        () => [...cosechas].sort((a, b) => (b.fechaCosecha ?? '').localeCompare(a.fechaCosecha ?? '')),
        [cosechas],
    );

    // El formulario completo de cosecha vive en el detalle del cultivo:
    // aquí solo se elige a cuál y se navega con ?cosecha=1 para que se abra solo
    const irARegistrarCosecha = () => {
        if (!cultivoCosecha) return;
        navigate('/cultivos/' + cultivoCosecha + '?cosecha=1');
    };

    const puedeGestionar = puede(GESTIONAR);

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto">
                <PageHeader
                    title="Cultivos"
                    subtitle="Gestión de cultivos y sus cosechas"
                    action={
                        puedeGestionar
                            ? pestana === 'Cultivo'
                                ? <Btn onClick={() => setModalNuevo(true)}><Plus size={16} />Nuevo Cultivo</Btn>
                                : <Btn onClick={() => setModalCosecha(true)}><Plus size={16} />Registrar cosecha</Btn>
                            : undefined
                    }
                />

                {/* Barra de pestañas segmentada */}
                <div className="flex bg-primary/10 rounded-xl p-1 mb-5">
                    {(['Cultivo', 'Cosecha'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setPestana(t)}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                                pestana === t
                                    ? 'bg-white text-primary shadow-sm border border-primary/10'
                                    : 'text-primary/60 hover:text-primary/80'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
                {cargando && <p className="text-muted-foreground text-sm mb-4">Cargando cultivos...</p>}

                {pestana === 'Cultivo' && (
                    <div>
                        {/* Filtro por lote */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                            <label className="text-sm font-semibold text-foreground shrink-0">Lote</label>
                            <select
                                value={filtroLote}
                                onChange={(e) => setFiltroLote(e.target.value)}
                                className="w-full sm:w-56 px-3 py-2 rounded-lg border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                            >
                                <option value="">Todos los lotes</option>
                                {lotes.map((l: Lote) => (
                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                ))}
                            </select>
                            {filtroLote && (
                                <button
                                    onClick={() => setFiltroLote('')}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                                >
                                    <X size={12} />Limpiar
                                </button>
                            )}
                        </div>

                        {!cargando && cultivos.length === 0 ? (
                            <EmptyState
                                icon={Leaf}
                                title={filtroLote ? 'No hay cultivos en este lote' : 'Aún no hay cultivos'}
                                description="Prueba seleccionando otro lote o agrega un nuevo cultivo."
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {cultivos.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => navigate('/cultivos/' + c.id)}
                                        className="bg-card border border-border rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`p-1.5 rounded-lg ${FONDO_TIPO[c.tipoCultivo] ?? 'bg-icon-bg'}`}>
                                                <Leaf size={16} className={ICONO_TIPO[c.tipoCultivo] ?? 'text-primary'} />
                                            </div>
                                            <StatusBadge status={c.estado} />
                                        </div>
                                        <p className="font-semibold text-[14px] text-foreground mb-0.5 leading-tight">{c.nombreCultivo}</p>
                                        <p className="text-[12px] text-primary font-medium mb-1.5">{c.tipoCultivo}</p>
                                        <div className="flex flex-col gap-0.5 text-[12px] text-muted-foreground mb-1">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={10} />{c.nombreLote}{c.nombreSubLote ? ` › ${c.nombreSubLote}` : ''}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Scale size={10} />{numero(c.areaM2 ?? 0)} m²
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} />Inicio: {fecha(c.fechaSiembra)}
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-border">
                                            {c.cosechas.length > 0 ? (
                                                <div className="space-y-0.5 text-[11px]">
                                                    <p className="flex justify-between">
                                                        <span className="text-muted-foreground">Total cosechado</span>
                                                        <span className="font-bold text-primary">{numero(c.totalKg)} kg</span>
                                                    </p>
                                                    <p className="flex justify-between">
                                                        <span className="text-muted-foreground">Cosechas</span>
                                                        <span className="font-semibold">{c.cosechas.length}</span>
                                                    </p>
                                                    <p className="flex justify-between">
                                                        <span className="text-muted-foreground">Última cosecha</span>
                                                        <span className="font-semibold">{fecha(c.ultimaCosecha)}</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-muted-foreground italic text-center py-0.5">
                                                    Sin cosechas registradas
                                                </p>
                                            )}
                                        </div>
                                        {puedeGestionar && (
                                            <div
                                                className="flex gap-3 mt-2 pt-2 border-t border-border"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {c.estado === 'activo' && (
                                                    <button
                                                        disabled={finalizando}
                                                        onClick={() => finalizar(c.id)}
                                                        className="text-[11px] font-semibold text-[#F16C07] hover:underline disabled:opacity-50"
                                                    >
                                                        Finalizar
                                                    </button>
                                                )}
                                                <button
                                                    disabled={eliminando}
                                                    onClick={() => eliminar(c.id)}
                                                    className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {pestana === 'Cosecha' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">
                                {cosechasOrdenadas.length} registro{cosechasOrdenadas.length !== 1 ? 's' : ''} de cosecha
                            </p>
                        </div>
                        {!cargando && cosechasOrdenadas.length === 0 ? (
                            <EmptyState
                                icon={Crop}
                                title="Sin registros de cosecha"
                                description="Aún no se han registrado cosechas en ningún cultivo."
                                action={
                                    puedeGestionar
                                        ? <Btn onClick={() => setModalCosecha(true)}><Plus size={14} />Registrar primera cosecha</Btn>
                                        : undefined
                                }
                            />
                        ) : (
                            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[820px]">
                                        <thead>
                                            <tr className="bg-muted border-b border-border">
                                                {['Cultivo', 'Fecha', 'Cantidad', 'Unidad', 'Calidad', 'Responsable', 'Destino', 'Observaciones'].map((col) => (
                                                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cosechasOrdenadas.map((h, i) => {
                                                const cultivo = nombrePorCultivo.get(h.cultivoId);
                                                const tipo = cultivo?.tipo ?? '';
                                                return (
                                                    <tr
                                                        key={h.id}
                                                        className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${
                                                            i % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${FONDO_TIPO[tipo] ?? 'bg-icon-bg'}`}>
                                                                    <Leaf size={10} className={ICONO_TIPO[tipo] ?? 'text-primary'} />
                                                                </div>
                                                                <button
                                                                    onClick={() => navigate('/cultivos/' + h.cultivoId)}
                                                                    className="text-xs font-semibold text-foreground whitespace-nowrap hover:text-primary hover:underline"
                                                                >
                                                                    {cultivo?.nombre ?? '—'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{fecha(h.fechaCosecha)}</td>
                                                        <td className="px-4 py-3 text-xs font-bold text-foreground">{numero(h.cantidadKg)}</td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground">kg</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${COLOR_CALIDAD[h.calidad] ?? 'bg-muted text-muted-foreground'}`}>
                                                                {ETIQUETA_CALIDAD[h.calidad] ?? h.calidad}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{h.responsable || '—'}</td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground">{h.destino || '—'}</td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{h.observaciones || '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Nuevo cultivo */}
                <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="Nuevo Cultivo">
                    {errorForm && <p className="text-red-600 mb-3 text-sm">{errorForm}</p>}
                    <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
                        <Select
                            label="Lote"
                            value={form.loteId}
                            onChange={(v) => handleFormChange({ target: { name: 'loteId', value: v } } as React.ChangeEvent<HTMLSelectElement>)}
                            options={[
                                { value: '', label: 'Seleccione un lote' },
                                ...lotesForm.map((l: Lote) => ({ value: String(l.id), label: l.nombre })),
                            ]}
                        />
                        <Input
                            label="Nombre del cultivo"
                            required
                            value={form.nombreCultivo}
                            onChange={(v) => handleFormChange({ target: { name: 'nombreCultivo', value: v } } as React.ChangeEvent<HTMLInputElement>)}
                            placeholder="Ej: Maíz amarillo"
                        />
                        <Input
                            label="Tipo de cultivo"
                            required
                            value={form.tipoCultivo}
                            onChange={(v) => handleFormChange({ target: { name: 'tipoCultivo', value: v } } as React.ChangeEvent<HTMLInputElement>)}
                            placeholder="Ej: Transitorio"
                        />
                        <Select
                            label="Sublote (opcional)"
                            value={form.subLoteId}
                            onChange={(v) => handleFormChange({ target: { name: 'subLoteId', value: v } } as React.ChangeEvent<HTMLSelectElement>)}
                            options={[
                                { value: '', label: 'Ninguno' },
                                ...sublotes.map((s: SubLote) => ({ value: String(s.id), label: s.nombre })),
                            ]}
                        />
                        <Input
                            label="Fecha de siembra"
                            type="date"
                            required
                            value={form.fechaSiembra}
                            onChange={(v) => handleFormChange({ target: { name: 'fechaSiembra', value: v } } as React.ChangeEvent<HTMLInputElement>)}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Btn variant="outline" onClick={() => setModalNuevo(false)}>Cancelar</Btn>
                            <Btn type="submit" disabled={creando}>{creando ? 'Guardando...' : 'Guardar'}</Btn>
                        </div>
                    </form>
                </Modal>

                {/* Elegir cultivo para registrar la cosecha */}
                <Modal open={modalCosecha} onClose={() => setModalCosecha(false)} title="Registrar cosecha">
                    <div className="flex flex-col gap-3">
                        <Select
                            label="¿En qué cultivo?"
                            value={cultivoCosecha}
                            onChange={setCultivoCosecha}
                            options={[
                                { value: '', label: 'Seleccione un cultivo' },
                                ...cultivos
                                    .filter((c) => c.estado === 'activo')
                                    .map((c) => ({ value: String(c.id), label: `${c.nombreCultivo} · ${c.nombreLote}` })),
                            ]}
                        />
                        <p className="text-xs text-muted-foreground">
                            El registro se completa en la ficha del cultivo, donde está el producto y los costos.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <Btn variant="outline" onClick={() => setModalCosecha(false)}>Cancelar</Btn>
                            <Btn onClick={irARegistrarCosecha} disabled={!cultivoCosecha}>Continuar</Btn>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default Cultivos;
