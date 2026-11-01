import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Box, Leaf, MessageSquare, Plus, Wrench } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Modal, PageHeader, Select, StatusBadge, Textarea } from '../../components/ui/AgroUI';
import { useMisNovedades } from '../../hooks/novedades/useMisNovedades';
import type { TipoNovedad, UrgenciaNovedad } from '../../types/novedades';

const TIPOS: { valor: TipoNovedad; etiqueta: string; icono: typeof Box }[] = [
    { valor: 'insumo_bajo', etiqueta: 'Insumo por acabarse', icono: Box },
    { valor: 'herramienta_danada', etiqueta: 'Herramienta dañada', icono: Wrench },
    { valor: 'problema_cultivo', etiqueta: 'Problema en el cultivo', icono: Leaf },
    { valor: 'otro', etiqueta: 'Otro', icono: AlertTriangle },
];

const URGENCIAS: { valor: UrgenciaNovedad; etiqueta: string }[] = [
    { valor: 'low', etiqueta: 'Baja' },
    { valor: 'medium', etiqueta: 'Media' },
    { valor: 'high', etiqueta: 'Alta' },
];

const fecha = (valor: string) =>
    new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const MisNovedades = () => {
    const {
        novedades, consumibles, herramientas, tareas,
        abierto, abrir, cerrar, cargando, error, errorEnvio, enviando, reportar,
    } = useMisNovedades();

    // El boton "Reportar novedad" del topbar llega aqui con ?reportar=1
    const [searchParams, setSearchParams] = useSearchParams();
    const pedirReporte = searchParams.get('reportar') === '1';

    useEffect(() => {
        if (!pedirReporte) return;
        abrir();
        setSearchParams({}, { replace: true });
    }, [pedirReporte, abrir, setSearchParams]);

    const [tipo, setTipo] = useState<TipoNovedad>('insumo_bajo');
    const [urgencia, setUrgencia] = useState<UrgenciaNovedad>('medium');
    const [descripcion, setDescripcion] = useState('');
    const [insumoId, setInsumoId] = useState('');
    const [herramientaId, setHerramientaId] = useState('');
    const [tareaId, setTareaId] = useState('');

    const cerrarModal = () => {
        cerrar();
        setTipo('insumo_bajo');
        setUrgencia('medium');
        setDescripcion('');
        setInsumoId('');
        setHerramientaId('');
        setTareaId('');
    };

    // El backend exige el insumo cuando es "insumo_bajo" y el nombre cuando es "herramienta_danada"
    const nombreHerramienta = herramientas.find((h) => String(h.id) === herramientaId)?.nombre ?? '';
    const completo =
        descripcion.trim().length >= 10 &&
        (tipo !== 'insumo_bajo' || insumoId !== '') &&
        (tipo !== 'herramienta_danada' || nombreHerramienta !== '');

    const enviar = () => {
        if (!completo) return;
        reportar({
            tipo,
            urgencia,
            descripcion: descripcion.trim(),
            ...(tipo === 'insumo_bajo' ? { insumoId: Number(insumoId) } : {}),
            ...(tipo === 'herramienta_danada' ? { nombreHerramienta } : {}),
            ...(tareaId ? { actividadId: Number(tareaId) } : {}),
        }, cerrarModal);
    };

    const detalle = (tipoNovedad: TipoNovedad, idInsumo: number | null, herramienta: string | null) => {
        if (tipoNovedad === 'insumo_bajo') {
            const insumo = consumibles.find((i) => i.id === idInsumo);
            return insumo ? insumo.nombre : idInsumo !== null ? 'Insumo #' + idInsumo : '';
        }
        if (tipoNovedad === 'herramienta_danada') return herramienta ?? '';
        return '';
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Mis novedades"
                    subtitle="Reporta lo que encuentres mientras trabajas"
                    action={<Btn onClick={abrir}><Plus className="w-4 h-4" /> Reportar</Btn>}
                />

                {(error || errorEnvio) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorEnvio}
                    </div>
                )}

                {cargando ? (
                    <Card className="p-6 text-sm text-muted-foreground">Cargando tus novedades...</Card>
                ) : novedades.length === 0 ? (
                    <EmptyState
                        icon={MessageSquare}
                        title="No has reportado novedades"
                        description="Si se acaba un insumo, se daña una herramienta o algo pasa en el cultivo, repórtalo aquí y tu instructor lo verá."
                        action={<Btn onClick={abrir}><Plus className="w-4 h-4" /> Reportar novedad</Btn>}
                    />
                ) : (
                    <div className="space-y-3">
                        {novedades.map((n) => {
                            const meta = TIPOS.find((t) => t.valor === n.tipo) ?? TIPOS[3];
                            const Icono = meta.icono;
                            const extra = detalle(n.tipo, n.insumoId, n.nombreHerramienta);
                            return (
                                <Card key={n.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 grid place-items-center">
                                            <Icono className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-foreground">{meta.etiqueta}</p>
                                                {extra && <span className="text-sm text-muted-foreground">· {extra}</span>}
                                                <StatusBadge status={n.urgencia} />
                                                <StatusBadge status={n.estado} />
                                            </div>
                                            <p className="mt-1 text-sm text-foreground/90">{n.descripcion}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">Reportada el {fecha(n.creadoEn)}</p>

                                            {n.respuestaInstructor && (
                                                <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                                        Respuesta del instructor
                                                    </p>
                                                    <p className="mt-1 text-sm text-foreground/90">{n.respuestaInstructor}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Modal open={abierto} onClose={cerrarModal} title="Reportar novedad">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-foreground mb-2">¿Qué pasó?</p>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPOS.map((t) => {
                                const Icono = t.icono;
                                const activo = tipo === t.valor;
                                return (
                                    <button
                                        key={t.valor}
                                        type="button"
                                        onClick={() => setTipo(t.valor)}
                                        className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition-all ${
                                            activo
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border text-foreground hover:border-primary/40'
                                        }`}
                                    >
                                        <Icono className="w-4 h-4 shrink-0" />
                                        {t.etiqueta}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {tipo === 'insumo_bajo' && (
                        <Select
                            label="¿Cuál insumo?"
                            value={insumoId}
                            onChange={setInsumoId}
                            options={[
                                { value: '', label: 'Selecciona el insumo' },
                                ...consumibles.map((i) => ({
                                    value: String(i.id),
                                    label: i.nombre + ' — quedan ' + i.stockDisponible + ' ' + i.unidadUso,
                                })),
                            ]}
                        />
                    )}

                    {tipo === 'herramienta_danada' && (
                        <Select
                            label="¿Cuál herramienta?"
                            value={herramientaId}
                            onChange={setHerramientaId}
                            options={[
                                { value: '', label: 'Selecciona la herramienta' },
                                ...herramientas.map((h) => ({ value: String(h.id), label: h.nombre })),
                            ]}
                        />
                    )}

                    <Textarea
                        label="Cuéntale al instructor"
                        value={descripcion}
                        onChange={setDescripcion}
                        placeholder="Describe lo que viste, dónde y desde cuándo (mínimo 10 caracteres)"
                        rows={4}
                        required
                    />

                    <div>
                        <p className="text-sm font-semibold text-foreground mb-2">¿Qué tan urgente es?</p>
                        <div className="grid grid-cols-3 gap-2">
                            {URGENCIAS.map((u) => (
                                <button
                                    key={u.valor}
                                    type="button"
                                    onClick={() => setUrgencia(u.valor)}
                                    className={`rounded-xl border p-2.5 text-sm font-semibold transition-all ${
                                        urgencia === u.valor
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border text-foreground hover:border-primary/40'
                                    }`}
                                >
                                    {u.etiqueta}
                                </button>
                            ))}
                        </div>
                    </div>

                    {tareas.length > 0 && (
                        <Select
                            label="¿Pasó en alguna de tus tareas? (opcional)"
                            value={tareaId}
                            onChange={setTareaId}
                            options={[
                                { value: '', label: 'No está relacionada con una tarea' },
                                ...tareas.map((t) => ({ value: String(t.id), label: t.nombre })),
                            ]}
                        />
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Btn variant="ghost" onClick={cerrarModal} disabled={enviando}>Cancelar</Btn>
                        <Btn onClick={enviar} disabled={!completo || enviando}>
                            {enviando ? 'Enviando...' : 'Enviar novedad'}
                        </Btn>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default MisNovedades;
