import { useState } from 'react';
import { Plus, Syringe } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, Input, Modal, PageHeader, Select, StatusBadge } from '../components/ui/AgroUI';
import { useTratamientos } from '../hooks/useTratamientos';
import type { EstadoTratamiento } from '../types/tratamientos';

// Al hacer clic en el badge, el tratamiento pasa al siguiente estado
const SIGUIENTE_ESTADO: Record<EstadoTratamiento, EstadoTratamiento> = {
    scheduled: 'applied',
    applied: 'scheduled',
};

// Se arma la fecha a mano para que no cambie de día por la zona horaria
const fmtFecha = (fecha: string) => {
    if (!fecha) return '—';
    const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
    return new Date(anio, mes - 1, dia)
        .toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtCosto = (costo: number) =>
    `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(costo || 0)}`;

const Tratamientos = () => {
    const [showNew, setShowNew] = useState(false);

    const {
        tratamientos, incidencias, cargando, error, tituloIncidencia,
        form, set, crear, creando, errorForm,
        cambiarEstado,
    } = useTratamientos();

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Tratamientos"
                    subtitle="Control de plagas y enfermedades"
                    action={<Btn onClick={() => setShowNew(true)}><Plus size={16} />Nuevo</Btn>}
                />

                {cargando && <p className="text-sm text-muted-foreground">Cargando tratamientos...</p>}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {tratamientos.map((t) => (
                        <Card key={t.id} className="p-3">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-1.5 bg-amber-100 rounded-lg">
                                    <Syringe size={14} className="text-amber-700" />
                                </div>
                                <button
                                    onClick={() => cambiarEstado(t.id, SIGUIENTE_ESTADO[t.estado])}
                                    title="Clic para cambiar el estado"
                                    className="transition hover:opacity-70"
                                >
                                    <StatusBadge status={t.estado} />
                                </button>
                            </div>
                            <p className="font-semibold text-foreground text-sm">{t.producto}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{tituloIncidencia(t.incidenciaId)}</p>
                            <p className="text-xs text-muted-foreground">{fmtFecha(t.fecha)}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                <span>Dosis: {t.dosis || '—'}</span>
                                <span>{fmtCosto(t.costo)}</span>
                            </div>
                            {t.notas && (
                                <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">{t.notas}</p>
                            )}
                        </Card>
                    ))}
                </div>

                {!cargando && !error && tratamientos.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aún no hay tratamientos registrados.</p>
                )}
            </div>

            <Modal open={showNew} onClose={() => setShowNew(false)} title="Nuevo Tratamiento">
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); crear(() => setShowNew(false)); }}>
                    {errorForm && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
                    )}

                    <Select
                        label="Incidencia asociada" value={form.incidenciaId} onChange={set('incidenciaId')}
                        options={[
                            { value: '', label: 'Seleccionar...' },
                            ...incidencias.map((i) => ({ value: String(i.id), label: i.titulo })),
                        ]}
                    />
                    <Input label="Producto / Tratamiento" value={form.producto} onChange={set('producto')} required
                        placeholder="Ej: Azufre micronizado 80%" />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Dosis" value={form.dosis} onChange={set('dosis')} placeholder="Ej: 3g/L" />
                        <Input label="Fecha de aplicación" value={form.fecha} onChange={set('fecha')} type="date" />
                    </div>
                    <Input label="Costo (COP)" value={form.costo} onChange={set('costo')} type="number" placeholder="45000" />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold">Notas</label>
                        <textarea
                            value={form.notas}
                            onChange={(e) => set('notas')(e.target.value)}
                            rows={3}
                            className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                            placeholder="Observaciones del tratamiento..."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Btn type="submit" disabled={creando} className="flex-1 justify-center">
                            {creando ? 'Guardando...' : 'Guardar'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setShowNew(false)}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default Tratamientos;