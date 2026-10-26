import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, FileText, GraduationCap, Phone, RotateCcw, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, PageHeader, StatCard, StatusBadge } from '../../components/ui/AgroUI';
import { useAprendizDetalle } from '../../hooks/instructor/useAprendizDetalle';
import type { Asignacion } from '../../types/instructor';

const fecha = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Campo = ({ icono: Icono, titulo, valor, mono = false }: {
    icono: typeof FileText; titulo: string; valor: string; mono?: boolean;
}) => (
    <div className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
        <Icono size={13} className="text-muted-foreground shrink-0" />
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{titulo}</p>
            <p className={'font-medium truncate ' + (mono ? 'font-mono text-primary' : '')}>{valor}</p>
        </div>
    </div>
);

/** El punto de color de la línea de tiempo, según cómo va la tarea. */
const color = (tarea: Asignacion) => {
    if (tarea.estado === 'APROBADA') return 'bg-emerald-500';
    if (tarea.estado === 'DEVUELTA') return 'bg-red-500';
    if (tarea.vencida) return 'bg-red-500';
    if (tarea.estado === 'ENTREGADA') return 'bg-primary';
    return 'bg-[#F59E0B]';
};

const AprendizDetalle = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const aprendizId = Number(id);
    const { aprendiz, tareas, devueltas, cargando, error, noEncontrado } = useAprendizDetalle(aprendizId);

    if (noEncontrado) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <EmptyState
                        icon={Users}
                        title="Aprendiz no encontrado"
                        description="No existe, o no está en las fichas a tu cargo."
                        action={<Btn variant="outline" onClick={() => navigate('/mis-fichas')}>Volver a mis fichas</Btn>}
                    />
                </div>
            </DashboardLayout>
        );
    }

    const volver = () =>
        aprendiz?.programaFormacionId
            ? navigate('/mis-fichas/' + aprendiz.programaFormacionId)
            : navigate('/mis-fichas');

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title={aprendiz ? aprendiz.nombre + ' ' + aprendiz.apellido : 'Aprendiz'}
                    subtitle={aprendiz?.idFicha ? 'Aprendiz · Ficha ' + aprendiz.idFicha : 'Aprendiz'}
                    onBack={volver}
                />

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {cargando || !aprendiz ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando...</p>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-1">
                            <div className="text-center mb-4">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-3xl font-bold text-primary">
                                    {aprendiz.nombre.charAt(0)}
                                </div>
                                <h2 className="font-bold text-foreground">
                                    {aprendiz.nombre} {aprendiz.apellido}
                                </h2>
                                <p className="text-sm text-muted-foreground break-all">{aprendiz.correo}</p>
                            </div>
                            <div className="space-y-2 text-sm">
                                <Campo icono={FileText} titulo="Documento" valor={aprendiz.identificacion} />
                                <Campo icono={Phone} titulo="Teléfono" valor={aprendiz.telefono} />
                                <Campo icono={GraduationCap} titulo="Ficha" valor={aprendiz.idFicha ?? 'Sin ficha'} mono />
                                <Campo icono={Clock} titulo="Último ingreso" valor={fecha(aprendiz.ultimoIngreso)} />
                            </div>
                        </Card>

                        <div className="lg:col-span-2 space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard icon={CheckCircle} label="Aprobadas" value={aprendiz.aprobadas} color="emerald" />
                                <StatCard
                                    icon={RotateCcw}
                                    label="Devueltas"
                                    value={devueltas}
                                    color={devueltas > 0 ? 'amber' : 'emerald'}
                                />
                                <StatCard
                                    icon={AlertTriangle}
                                    label="Vencidas"
                                    value={aprendiz.vencidas}
                                    color={aprendiz.vencidas > 0 ? 'red' : 'emerald'}
                                />
                                <StatCard icon={Clock} label="Horas acumuladas" value={aprendiz.horas + 'h'} color="primary" />
                            </div>

                            <Card>
                                <h3 className="font-semibold text-foreground mb-3">Línea de tiempo de tareas</h3>

                                {tareas.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        Todavía no tiene tareas asignadas.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {tareas.map((tarea) => (
                                            <div key={tarea.id} className="flex items-start gap-3">
                                                <span
                                                    className={
                                                        'w-3 h-3 rounded-full border-2 border-white shrink-0 mt-3 ' + color(tarea)
                                                    }
                                                />
                                                <div className="flex-1 min-w-0 p-3 bg-muted/40 rounded-xl border border-border">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {tarea.actividad?.nombre ?? 'Actividad'}
                                                        </p>
                                                        <StatusBadge status={tarea.estado} />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Asignada: {fecha(tarea.creadoEn)}
                                                        {tarea.entregadaEn ? ' · Entregada: ' + fecha(tarea.entregadaEn) : ''}
                                                        {tarea.horasTrabajadas !== null ? ' · ' + tarea.horasTrabajadas + 'h' : ''}
                                                    </p>
                                                    {tarea.comentarioInstructor && (
                                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                                            Tu comentario: {tarea.comentarioInstructor}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AprendizDetalle;
