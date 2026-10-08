import { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Btn, Card, Input, Modal, PageHeader, Select, StatusBadge } from '../components/ui/AgroUI';
import { useUnidadesProductivas } from '../hooks/useUnidadesProductivas';

type Severidad = 'low' | 'medium' | 'high';
type EstadoIncidencia = 'open' | 'in_treatment' | 'resolved';

interface Incidencia {
    id: number;
    title: string;
    type: string;
    severity: Severidad;
    status: EstadoIncidencia;
    unitId: string;
    date: string;        // YYYY-MM-DD
    description: string;
}

// Datos de ejemplo del diseño (el backend aún no guarda incidencias)
const INCIDENCIAS_EJEMPLO: Incidencia[] = [
    {
        id: 1,
        title: 'Brote de Mildiu Polvoroso',
        type: 'Enfermedad fúngica',
        severity: 'high',
        status: 'in_treatment',
        unitId: '',
        date: '2024-04-17',
        description: 'Se detectaron manchas blancas en hojas superiores',
    },
    {
        id: 2,
        title: 'Áfidos en tallo principal',
        type: 'Plaga de insectos',
        severity: 'medium',
        status: 'resolved',
        unitId: '',
        date: '2024-04-04',
        description: 'Colonias de pulgones en brotes nuevos',
    },
];

// Filtros del diseño, con el estado al que corresponde cada uno
const FILTROS: { label: string; estado: EstadoIncidencia | 'Todas' }[] = [
    { label: 'Todas', estado: 'Todas' },
    { label: 'Abiertas', estado: 'open' },
    { label: 'En tratamiento', estado: 'in_treatment' },
    { label: 'Resueltas', estado: 'resolved' },
];

const TIPOS = [
    'Enfermedad fúngica', 'Enfermedad bacteriana', 'Plaga de insectos',
    'Arvense', 'Deficiencia nutricional', 'Otro',
];

const SEVERIDAD_COLOR: Record<Severidad, 'info' | 'warning' | 'danger'> = {
    low: 'info', medium: 'warning', high: 'danger',
};
const SEVERIDAD_TEXTO: Record<Severidad, string> = {
    low: 'Baja', medium: 'Media', high: 'Alta',
};

const FORM_INICIAL = {
    title: '', type: TIPOS[0], severity: 'medium' as Severidad, unitId: '', description: '',
};

// Se arma la fecha a mano para que no cambie de día por la zona horaria
const fmtFecha = (fecha: string) => {
    const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
    return new Date(anio, mes - 1, dia)
        .toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const hoy = () => new Date().toISOString().slice(0, 10);

const Incidencias = () => {
    const [filtro, setFiltro] = useState<EstadoIncidencia | 'Todas'>('Todas');
    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState(FORM_INICIAL);
    // Por ahora las incidencias viven solo en pantalla (el backend aún no las guarda)
    const [incidencias, setIncidencias] = useState<Incidencia[]>(INCIDENCIAS_EJEMPLO);

    const { unidades } = useUnidadesProductivas();

    const set = (campo: keyof typeof FORM_INICIAL) => (valor: string) =>
        setForm((prev) => ({ ...prev, [campo]: valor }));

    const visibles = incidencias.filter((i) => filtro === 'Todas' || i.status === filtro);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIncidencias((prev) => [
            {
                id: Date.now(),
                title: form.title,
                type: form.type,
                severity: form.severity,
                status: 'open',
                unitId: form.unitId,
                date: hoy(),
                description: form.description,
            },
            ...prev,
        ]);
        setForm(FORM_INICIAL);
        setShowNew(false);
    };

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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {visibles.map((i) => (
                        <Card key={i.id} className="p-3">
                            <div className="flex items-start justify-between mb-2">
                                <div className={`p-1.5 rounded-lg ${i.severity === 'high' ? 'bg-red-100' : i.severity === 'medium' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                                    <AlertTriangle size={14} className={i.severity === 'high' ? 'text-red-600' : i.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'} />
                                </div>
                                <StatusBadge status={i.status} />
                            </div>
                            <p className="font-semibold text-foreground text-sm">{i.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{i.type}</p>
                            <p className="text-xs text-muted-foreground">{fmtFecha(i.date)}</p>
                            <div className="mt-2">
                                <Badge color={SEVERIDAD_COLOR[i.severity]}>Sev. {SEVERIDAD_TEXTO[i.severity]}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{i.description}</p>
                        </Card>
                    ))}
                </div>

                {visibles.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        {incidencias.length === 0
                            ? 'Aún no hay incidencias registradas.'
                            : 'Ninguna incidencia coincide con el filtro.'}
                    </p>
                )}
            </div>

            <Modal open={showNew} onClose={() => setShowNew(false)} title="Nueva Incidencia">
                <form className="space-y-3" onSubmit={handleSubmit}>
                    <Input label="Título" value={form.title} onChange={set('title')} required
                        placeholder="Ej: Brote de Mildiu en tomate" />
                    <Select label="Tipo" value={form.type} onChange={set('type')} options={TIPOS} />
                    <Select
                        label="Severidad" value={form.severity} onChange={set('severity')}
                        options={[
                            { value: 'low', label: 'Baja' },
                            { value: 'medium', label: 'Media' },
                            { value: 'high', label: 'Alta' },
                        ]}
                    />
                    <Select
                        label="Unidad productiva" value={form.unitId} onChange={set('unitId')}
                        options={[
                            { value: '', label: 'Seleccionar...' },
                            ...unidades.map((u) => ({ value: String(u.id), label: u.nombreCultivo })),
                        ]}
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => set('description')(e.target.value)}
                            rows={3}
                            className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                            placeholder="Describe los síntomas observados..."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Btn type="submit" className="flex-1 justify-center">Registrar</Btn>
                        <Btn variant="outline" onClick={() => setShowNew(false)}>Cancelar</Btn>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default Incidencias;