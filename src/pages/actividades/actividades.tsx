import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Package, Plus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, EmptyState, Input, Modal, PageHeader, Select, Textarea } from '../../components/ui/AgroUI';
import { useActividades } from '../../hooks/Actividades/useActividad';
import { useActividadForm } from '../../hooks/Actividades/useActividadForm';
import { useAsignarAprendices } from '../../hooks/Actividades/useAsignarAprendices';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { useMisTareas } from '../../hooks/instructor/useMisTareas';

const FILTROS = ['Todas', 'Pendiente', 'En progreso', 'Finalizada'];

// El chip del estado, con los colores del sistema
const ESTILO_ESTADO: Record<string, string> = {
    Finalizada: 'bg-chip-bg text-chip-fg',
    En_progreso: 'bg-[#FFF3E0] text-[#F16C07]',
    Pendiente: 'bg-red-100 text-red-700',
};

// Los avatares rotan de color, como en el diseño
const COLORES_AVATAR = [
    'bg-primary/20 text-primary',
    'bg-blue-100 text-blue-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
];

const EJECUTAR_ACTIVIDADES = 'actividades.ejecutar';
const GESTIONAR_ACTIVIDADES = 'actividades.gestionar';

const Actividades = () => {
    const navigate = useNavigate();
    const { puede } = usePermisos();
    const puedeGestionar = puede(GESTIONAR_ACTIVIDADES);
    const esAprendiz = puede(EJECUTAR_ACTIVIDADES) && !puedeGestionar;

    const [modalNueva, setModalNueva] = useState(false);
    const { actividades, loading, error, filtroEstado, setFiltroEstado, handleChangeEstado } =
        useActividades(null);

    const {
        form, lotes, sublotes, cultivos, productos,
        handleFormChange, handleCreateSubmit, enviando, errorForm,
    } = useActividadForm({ isModalOpen: modalNueva, onSuccess: () => setModalNueva(false) });

    const asignacion = useAsignarAprendices(actividades.map((a) => a.id));
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [fechaLimite, setFechaLimite] = useState('');

    // El aviso que el Figma le muestra al aprendiz
    const { conteos } = useMisTareas();
    const pendientes = esAprendiz ? conteos.Pendientes : 0;

    const cerrarAsignar = () => {
        asignacion.cerrar();
        setSeleccionados([]);
        setFechaLimite('');
    };

    const alternar = (id: number) =>
        setSeleccionados((previos) =>
            previos.includes(id) ? previos.filter((x) => x !== id) : [...previos, id]);

    // El formulario del modal usa eventos, no valores sueltos
    const campo = (name: string) => (valor: string) =>
        handleFormChange({ target: { name, value: valor } } as React.ChangeEvent<HTMLInputElement>);

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <PageHeader
                    title="Actividades Agrícolas"
                    subtitle="Labores y Tareas de Campo"
                    action={
                        <div className="flex gap-2">
                            <Btn variant="outline" onClick={() => navigate('/inventario')}>
                                <Package size={16} />Productos
                            </Btn>
                            {puedeGestionar && (
                                <Btn onClick={() => setModalNueva(true)}>
                                    <Plus size={16} />Nueva Actividad
                                </Btn>
                            )}
                        </div>
                    }
                />

                {pendientes > 0 && (
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-icon-bg p-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <ClipboardList size={16} className="text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">
                                {pendientes} tarea{pendientes === 1 ? '' : 's'} pendiente{pendientes === 1 ? '' : 's'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Tienes actividades asignadas por tu instructor
                            </p>
                        </div>
                        <Btn size="sm" variant="outline" onClick={() => navigate('/mis-tareas')}>
                            Ver tareas
                        </Btn>
                    </div>
                )}

                <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                    {FILTROS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFiltroEstado(f)}
                            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                filtroEstado === f
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-primary/10'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando actividades…</p>
                ) : actividades.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="No hay actividades en esta categoría"
                        description="Las actividades que se registren para tus lotes aparecerán aquí."
                        action={
                            puedeGestionar
                                ? <Btn onClick={() => setModalNueva(true)}><Plus size={16} />Nueva Actividad</Btn>
                                : undefined
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {actividades.map((actividad) => {
                            const p = asignacion.progreso(actividad.id);
                            const estado = actividad.estado ?? 'Pendiente';

                            return (
                                <div
                                    key={actividad.id}
                                    onClick={() => navigate('/actividades/' + actividad.id, { state: { actividad } })}
                                    className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <p className="text-[15px] font-semibold leading-tight text-foreground">
                                            {actividad.tipo}{actividad.subtipo ? ' — ' + actividad.subtipo : ''}
                                        </p>
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (puedeGestionar) handleChangeEstado(actividad.id, actividad.estado);
                                            }}
                                            className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                ESTILO_ESTADO[estado] ?? 'bg-muted text-muted-foreground'
                                            } ${puedeGestionar ? 'cursor-pointer hover:opacity-80' : ''}`}
                                        >
                                            {estado.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                                        {actividad.descripcion || 'Sin descripción registrada.'}
                                    </p>

                                    {p.total > 0 && (
                                        <div className="mb-3">
                                            <div className="mb-1.5 flex items-center gap-2">
                                                <div className="flex -space-x-1.5">
                                                    {p.iniciales.map((inicial, i) => (
                                                        <div
                                                            key={i}
                                                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2 ring-background ${COLORES_AVATAR[i % 4]}`}
                                                        >
                                                            {inicial}
                                                        </div>
                                                    ))}
                                                    {p.restantes > 0 && (
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground ring-2 ring-background">
                                                            +{p.restantes}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {p.aprobadas} de {p.total} aprobadas
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-muted">
                                                <div
                                                    className="h-1.5 rounded-full bg-primary transition-all"
                                                    style={{ width: p.porcentaje + '%' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border-t border-border pt-2">
                                        <p className="text-xs text-muted-foreground">{actividad.fecha}</p>
                                        {asignacion.puedeAsignar && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); asignacion.abrir(actividad.id); }}
                                                className="text-xs font-semibold text-primary transition-colors hover:text-primary/70"
                                            >
                                                Asignar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <Modal open={modalNueva} onClose={() => setModalNueva(false)} title="Nueva Actividad">
                    <form onSubmit={handleCreateSubmit} className="space-y-3">
                        {errorForm && <p className="text-sm text-red-600">{errorForm}</p>}

                        <Input
                            label="Tipo de actividad" required
                            value={form.tipo || ''} onChange={campo('tipo')}
                            placeholder="Ej: Fertilización"
                        />
                        <Input
                            label="Subtipo"
                            value={form.subtipo || ''} onChange={campo('subtipo')}
                            placeholder="Ej: Trasplante"
                        />
                        <Select
                            label="Lote" value={String(form.loteId || '')} onChange={campo('loteId')}
                            options={[
                                { value: '', label: 'Seleccione un lote...' },
                                ...(lotes ?? []).map((l: { id: number; nombre: string }) => ({
                                    value: String(l.id), label: l.nombre,
                                })),
                            ]}
                        />
                        <Select
                            label="Sublote" value={String(form.subLoteId || '')} onChange={campo('subLoteId')}
                            options={[
                                { value: '', label: 'Sin sublote' },
                                ...(sublotes ?? []).map((s: { id: number; nombre: string }) => ({
                                    value: String(s.id), label: s.nombre,
                                })),
                            ]}
                        />
                        <Select
                            label="Cultivo" value={String(form.cultivoId || '')} onChange={campo('cultivoId')}
                            options={[
                                { value: '', label: 'Seleccione un cultivo...' },
                                ...(cultivos ?? []).map((c: { id: number; nombreCultivo?: string; tipoCultivo?: string }) => ({
                                    value: String(c.id),
                                    label: c.nombreCultivo || c.tipoCultivo || 'Cultivo #' + c.id,
                                })),
                            ]}
                        />
                        <Select
                            label="Producto / Insumo" value={String(form.productoAgroId || '')} onChange={campo('productoAgroId')}
                            options={[
                                { value: '', label: 'Sin producto' },
                                ...(productos ?? []).map((pr: { id: number; nombre: string }) => ({
                                    value: String(pr.id), label: pr.nombre,
                                })),
                            ]}
                        />
                        <Input label="Fecha" type="date" required value={form.fecha || ''} onChange={campo('fecha')} />
                        <Textarea
                            label="Descripción" rows={3}
                            value={form.descripcion || ''} onChange={campo('descripcion')}
                            placeholder="Detalles adicionales de la labor..."
                        />

                        <div className="flex gap-3 pt-1">
                            <Btn type="submit" disabled={enviando} className="flex-1 justify-center">
                                {enviando ? 'Guardando…' : 'Guardar'}
                            </Btn>
                            <Btn variant="outline" onClick={() => setModalNueva(false)}>Cancelar</Btn>
                        </div>
                    </form>
                </Modal>

                <Modal
                    open={asignacion.actividadId !== null}
                    onClose={cerrarAsignar}
                    title="Asignar aprendices"
                >
                    <div className="space-y-4">
                        {asignacion.errorAsignar && (
                            <p className="text-sm text-red-600">{asignacion.errorAsignar}</p>
                        )}

                        {asignacion.aprendices.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No tienes aprendices a cargo. Revisa tus fichas antes de asignar.
                            </p>
                        ) : (
                            <>
                                <div>
                                    <p className="mb-2 text-sm font-semibold text-foreground">
                                        Aprendices <span className="text-red-500">*</span>
                                    </p>
                                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                                        {asignacion.aprendices.map((a, i) => (
                                            <label
                                                key={a.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionados.includes(a.id)}
                                                    onChange={() => alternar(a.id)}
                                                    className="rounded border-border accent-primary"
                                                />
                                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${COLORES_AVATAR[i % 4]}`}>
                                                    {a.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="flex-1 truncate text-sm text-foreground">
                                                    {a.nombre} {a.apellido}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSeleccionados(asignacion.aprendices.map((a) => a.id))}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Toda la ficha
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSeleccionados([])}
                                            className="text-xs text-muted-foreground hover:underline"
                                        >
                                            Quitar todos
                                        </button>
                                        {seleccionados.length > 0 && (
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {seleccionados.length} seleccionado{seleccionados.length === 1 ? '' : 's'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Input
                                        label="Fecha límite de entrega" type="date"
                                        value={fechaLimite} onChange={setFechaLimite}
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Opcional. Sin fecha, la tarea no se marca como vencida.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Btn
                                        disabled={seleccionados.length === 0 || asignacion.asignando}
                                        onClick={() =>
                                            asignacion.asignar(asignacion.actividadId!, seleccionados, fechaLimite, cerrarAsignar)}
                                        className="flex-1 justify-center"
                                    >
                                        {asignacion.asignando ? 'Asignando…' : 'Asignar'}
                                    </Btn>
                                    <Btn variant="outline" onClick={cerrarAsignar} disabled={asignacion.asignando}>
                                        Cancelar
                                    </Btn>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default Actividades;
