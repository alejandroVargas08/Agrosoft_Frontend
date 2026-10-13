import { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Btn, Card, Input, Modal, PageHeader, Select, StatusBadge } from '../components/ui/AgroUI';
import { useIncidencias } from '../hooks/useIncidencias';
import { useUnidadesProductivas } from '../hooks/useUnidadesProductivas';
import type { EstadoIncidencia, SeveridadIncidencia } from '../types/incidencias';

// Filtros del diseño, con el estado al que corresponde cada uno
const FILTROS: { label: string; estado: EstadoIncidencia | 'Todas' }[] = [
    { label: 'Todas', estado: 'Todas' },
    { label: 'Abiertas', estado: 'open' },
    { label: 'En tratamiento', estado: 'in_treatment' },
    { label: 'Resueltas', estado: 'resolved' },
];

// Al hacer clic en el badge, la incidencia pasa al siguiente estado
const SIGUIENTE_ESTADO: Record<EstadoIncidencia, EstadoIncidencia> = {
    open: 'in_treatment',
    in_treatment: 'resolved',
    resolved: 'open',
};

const TIPOS = [
    'Enfermedad fúngica', 'Enfermedad bacteriana', 'Plaga de insectos',
    'Arvense', 'Deficiencia nutricional', 'Otro',
];

const SEVERIDAD_COLOR: Record<SeveridadIncidencia, 'info' | 'warning' | 'danger'> = {
    low: 'info', medium: 'warning', high: 'danger',
};
const SEVERIDAD_TEXTO: Record<SeveridadIncidencia, string> = {
    low: 'Baja', medium: 'Media', high: 'Alta',
};

// Se arma la fecha a mano para que no cambie de día por la zona horaria
const fmtFecha = (fecha: string) => {
    const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
    return new Date(anio, mes - 1, dia)
        .toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Incidencias = () => {
    const [showNew, setShowNew] = useState(false);

    const {
        incidencias, cargando, error,
        filtro, setFiltro,
        form, set, crear, creando, errorForm,
        cambiarEstado,
    } = useIncidencias();

    const { unidades } = useUnidadesProductivas();

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Incidencias"
                    subtitle="Plagas, enfermedades y eventos"
                    action={<Btn onClick={() => setShowNew(true)}><Plus size={16} />Nueva</Btn>}
                />

                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {FILTROS.map((f) => (
                        <button
                            key={f.label}
                            onClick={() => setFiltro(f.estado)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filtro === f.estado ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {cargando && <p className="text-sm text-muted-foreground">Cargando incidencias...</p>}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {incidencias.map((i) => (
                        <Card key={i.id} className="p-3">
                            <div className="flex items-start justify-between mb-2">
                                <div className={`p-1.5 rounded-lg ${i.severidad === 'high' ? 'bg-red-100' : i.severidad === 'medium' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                                    <AlertTriangle size={14} className={i.severidad === 'high' ? 'text-red-600' : i.severidad === 'medium' ? 'text-amber-600' : 'text-blue-600'} />
                                </div>
                                <button
                                    onClick={() => cambiarEstado(i.id, SIGUIENTE_ESTADO[i.estado])}
                                    title="Clic para cambiar el estado"
                                    className="transition hover:opacity-70"
                                >
                                    <StatusBadge status={i.estado} />
                                </button>
                            </div>
                            <p className="font-semibold text-foreground text-sm">{i.titulo}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{i.tipo}</p>
                            <p className="text-xs text-muted-foreground">{fmtFecha(i.fecha)}</p>
                            <div className="mt-2">
                                <Badge color={SEVERIDAD_COLOR[i.severidad]}>Sev. {SEVERIDAD_TEXTO[i.severidad]}</Badge>
                            </div>
                            {i.descripcion && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{i.descripcion}</p>
                            )}
                        </Card>
                    ))}
                </div>

                {!cargando && !error && incidencias.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        {filtro === 'Todas'
                            ? 'Aún no hay incidencias registradas.'
                            : 'Ninguna incidencia coincide con el filtro.'}
                    </p>
                )}
            </div>

            <Modal open={showNew} onClose={() => setShowNew(false)} title="Nueva Incidencia">
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); crear(() => setShowNew(false)); }}>
                    {errorForm && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
                    )}

                    <Input label="Título" value={form.titulo} onChange={set('titulo')} required
                        placeholder="Ej: Brote de Mildiu en tomate" />
                    <Select label="Tipo" value={form.tipo} onChange={set('tipo')} options={TIPOS} />
                    <Select
                        label="Severidad" value={form.severidad} onChange={set('severidad')}
                        options={[
                            { value: 'low', label: 'Baja' },
                            { value: 'medium', label: 'Media' },
                            { value: 'high', label: 'Alta' },
                        ]}
                    />
                    <Select
                        label="Unidad productiva" value={form.cultivoId} onChange={set('cultivoId')}
                        options={[
                            { value: '', label: 'Seleccionar...' },
                            ...unidades.map((u) => ({ value: String(u.id), label: u.nombreCultivo })),
                        ]}
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold">Descripción</label>
                        <textarea
                            value={form.descripcion}
                            onChange={(e) => set('descripcion')(e.target.value)}
                            rows={3}
                            className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                            placeholder="Describe los síntomas observados..."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Btn type="submit" disabled={creando} className="flex-1 justify-center">
                            {creando ? 'Guardando...' : 'Registrar'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setShowNew(false)}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default Incidencias;