import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, AlertTriangle, Crop, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Input, Modal, PageHeader, Select, StatusBadge, Tab, Textarea } from '../components/ui/AgroUI';
import { useUnidadProductiva } from '../hooks/useUnidadProductiva';
import { useIncidencias } from '../hooks/useIncidencias';
import type { HistorialCultivo } from '../types/produccion';

const TIPOS_CULTIVO = ['Horticultura', 'Cereales', 'Fruticultura', 'Hidroponía', 'Aromáticas', 'Leguminosas'];

const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
const fmtFecha = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
// Fechas sin hora (siembra, incidencia): llegan a medianoche UTC y en Colombia
// se verían un día antes si no se leen en UTC
const fmtDia = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
const fmtRelativo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return 'Hace un momento';
    if (h < 24) return `Hace ${h}h`;
    return `Hace ${d}d`;
};

const DetalleUnidadProductiva = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [tab, setTab] = useState('General');

    const {
        unidad, historial, cosechas, ubicacion, cargando, error,
        editar, guardando, errorEdicion, limpiarEdicion,
    } = useUnidadProductiva(Number(id));

    // Todas las incidencias, filtradas aquí por la unidad que se está viendo
    const { incidencias } = useIncidencias();
    const incidenciasUnidad = incidencias.filter((i) => i.cultivoId === Number(id));
    const incidenciasActivas = incidenciasUnidad.filter((i) => i.estado !== 'resolved').length;
    const kgCosechados = cosechas.reduce((total, c) => total + Number(c.cantidadKg || 0), 0);

    const [editando, setEditando] = useState(false);
    const FORM_VACIO = { nombre: '', tipo: '', area: '', inicio: '', motivo: '' };
    const [form, setForm] = useState(FORM_VACIO);
    const poner = (clave: keyof typeof FORM_VACIO) => (valor: string) => setForm((f) => ({ ...f, [clave]: valor }));

    const abrirEdicion = () => {
        if (!unidad) return;
        limpiarEdicion();
        setForm({
            nombre: unidad.nombreCultivo,
            tipo: unidad.tipoCultivo,
            area: unidad.areaM2 != null ? String(unidad.areaM2) : '',
            inicio: unidad.fechaSiembra.slice(0, 10),
            motivo: '',
        });
        setEditando(true);
    };

    if (cargando) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <p className="text-sm text-muted-foreground">Cargando unidad...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !unidad) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <PageHeader title="Unidad productiva" onBack={() => navigate('/unidades-productivas')} />
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                        {error ?? 'No se encontró la unidad'}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Solo se manda lo que cambió; el área vacía no se toca
    const cambios = {
        ...(form.nombre.trim() !== unidad.nombreCultivo ? { nombreCultivo: form.nombre.trim() } : {}),
        ...(form.tipo !== unidad.tipoCultivo ? { tipoCultivo: form.tipo } : {}),
        ...(form.inicio !== unidad.fechaSiembra.slice(0, 10) ? { fechaSiembra: form.inicio } : {}),
        ...(form.area.trim() !== '' && Number(form.area) !== unidad.areaM2 ? { areaM2: Number(form.area) } : {}),
    };
    const areaValida = form.area.trim() === '' || Number(form.area) >= 0;
    const puedeGuardar =
        form.nombre.trim() !== '' && form.tipo !== '' && form.inicio !== '' && areaValida &&
        Object.keys(cambios).length > 0;

    const guardar = () => {
        if (!puedeGuardar) return;
        editar(
            { ...cambios, ...(form.motivo.trim() ? { motivo: form.motivo.trim() } : {}) },
            () => { setEditando(false); toast.success('Unidad productiva actualizada'); },
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title={unidad.nombreCultivo}
                    subtitle={unidad.tipoCultivo}
                    onBack={() => navigate('/unidades-productivas')}
                    action={<Btn variant="outline" size="sm" onClick={abrirEdicion}><Edit2 size={14} />Editar</Btn>}
                />

                <Tab tabs={['General', 'Incidencias', 'Cosechas', 'Historial']} active={tab} onChange={setTab} />

                {tab === 'General' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                            <h3 className="font-semibold text-foreground mb-3">Información general</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Estado</span><StatusBadge status={unidad.estado} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tipo</span>
                                    <span className="font-medium">{unidad.tipoCultivo}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Área</span>
                                    <span className="font-medium">{ubicacion.areaM2 !== undefined ? `${fmt(ubicacion.areaM2)} m²` : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lote</span>
                                    <span className="font-medium">{ubicacion.nombre}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Inicio</span>
                                    <span className="font-medium">{fmtDia(unidad.fechaSiembra)}</span>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <h3 className="font-semibold text-foreground mb-3">Resumen</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground">Incidencias activas</span>
                                    <span className="font-bold text-red-500">{incidenciasActivas}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground">Total cosechas</span>
                                    <span className="font-bold text-primary">{cosechas.length}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground">kg cosechados</span>
                                    <span className="font-bold text-primary">{fmt(kgCosechados)} kg</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {tab === 'Incidencias' && (
                    <div className="space-y-3">
                        {incidenciasUnidad.length === 0 ? (
                            <EmptyState icon={AlertTriangle} title="Sin incidencias" description="No hay incidencias registradas" />
                        ) : (
                            incidenciasUnidad.map((i) => (
                                <Card key={i.id}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">{i.titulo}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {i.tipo} · {fmtDia(i.fecha)}
                                            </p>
                                        </div>
                                        <StatusBadge status={i.estado} />
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {tab === 'Cosechas' && (
                    <div className="space-y-3">
                        {cosechas.length === 0 ? (
                            <EmptyState icon={Crop} title="Sin cosechas" description="No hay cosechas registradas" />
                        ) : (
                            cosechas.map((c) => (
                                <Card key={c.id}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">{fmt(Number(c.cantidadKg))} kg</p>
                                            <p className="text-sm text-muted-foreground">{fmtFecha(c.fechaCosecha)}</p>
                                        </div>
                                        <StatusBadge status={c.calidad} />
                                    </div>
                                    {c.observaciones && <p className="text-xs text-muted-foreground mt-2">{c.observaciones}</p>}
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {tab === 'Historial' && (
                    <div className="space-y-3">
                        {historial.length === 0
                            ? <EmptyState icon={Clock} title="Sin cambios" description="No hay historial de cambios" />
                            : historial.map((h) => <TarjetaHistorial key={h.id} registro={h} />)}
                    </div>
                )}

                <Modal open={editando} onClose={() => setEditando(false)} title="Editar Unidad Productiva">
                    <div className="space-y-4">
                        <Input label="Nombre" value={form.nombre} onChange={poner('nombre')} required placeholder="Ej: Tomate Chonto" />
                        <Select
                            label="Tipo de cultivo"
                            value={form.tipo}
                            onChange={poner('tipo')}
                            options={TIPOS_CULTIVO.includes(form.tipo) || !form.tipo ? TIPOS_CULTIVO : [form.tipo, ...TIPOS_CULTIVO]}
                        />
                        <Input label="Área (m²)" value={form.area} onChange={poner('area')} type="number" placeholder="2000" />
                        <Input label="Fecha de inicio" value={form.inicio} onChange={poner('inicio')} type="date" />
                        <Textarea
                            label="Motivo del cambio"
                            value={form.motivo}
                            onChange={poner('motivo')}
                            placeholder="Queda en el historial de la unidad"
                            rows={2}
                        />
                        {errorEdicion && <p className="text-sm text-red-600">{errorEdicion}</p>}
                        <div className="flex gap-3 pt-1">
                            <Btn disabled={guardando || !puedeGuardar} onClick={guardar} className="flex-1 justify-center">
                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                            </Btn>
                            <Btn variant="outline" onClick={() => setEditando(false)}>Cancelar</Btn>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

const mostrar = (valor: unknown) =>
    valor === null || valor === undefined || valor === '' ? '—' : String(valor);

// Una entrada del historial, como la tarjeta de auditoría del diseño
function TarjetaHistorial({ registro }: { registro: HistorialCultivo }) {
    const campos = Object.entries(registro.cambios ?? {});
    const accion = 'estado' in (registro.cambios ?? {}) ? 'finalizar' : 'editar';
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User size={14} className="text-primary" />
                </div>
                <div className="w-0.5 bg-border flex-1 mt-1" />
            </div>
            <Card className="flex-1 mb-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">
                        {registro.usuarioNombre ?? `Usuario #${registro.usuarioId}`}
                    </span>
                    {registro.fecha && <span className="text-xs text-muted-foreground">{fmtRelativo(registro.fecha)}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{accion} · Unidad productiva</p>
                <div className="mt-2 p-2 bg-muted rounded-lg text-xs space-y-1">
                    {campos.map(([campo, valor]) => {
                        const par = valor as { antes?: unknown; despues?: unknown } | null;
                        const conPar = par !== null && typeof par === 'object' && 'despues' in par;
                        return (
                            <div key={campo}>
                                <span className="font-medium">{campo}:</span>{' '}
                                {conPar ? (
                                    <>
                                        <span className="text-red-500 line-through">{mostrar(par.antes)}</span> →{' '}
                                        <span className="text-emerald-600">{mostrar(par.despues)}</span>
                                    </>
                                ) : (
                                    <span className="text-emerald-600">{mostrar(valor)}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
                {registro.motivo && <p className="text-xs text-muted-foreground mt-1 italic">"{registro.motivo}"</p>}
            </Card>
        </div>
    );
}

export default DetalleUnidadProductiva;
