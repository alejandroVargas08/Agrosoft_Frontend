import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, ClipboardList, Leaf, MapPin } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Input, Modal, PageHeader, StatusBadge, Tab, Textarea } from '../../components/ui/AgroUI';
import { useMisTareas } from '../../hooks/instructor/useMisTareas';
import type { PestanaTarea, TareaPropia } from '../../hooks/instructor/useMisTareas';
import { ChecklistEntrega } from '../../components/instructor/ChecklistEntrega';

const PESTANAS: PestanaTarea[] = ['Pendientes', 'Entregadas', 'Aprobadas'];

const fecha = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : 'sin fecha';

/** El plazo en palabras, con el color según qué tan encima esté. */
const plazo = (tarea: TareaPropia) => {
    const { asignacion, diasParaEntregar: dias } = tarea;
    if (asignacion.vencida) {
        return { texto: 'Vencida · ' + fecha(asignacion.fechaLimite), clase: 'text-red-600 font-bold' };
    }
    if (dias === null) return { texto: 'Sin fecha de entrega', clase: 'text-muted-foreground' };
    return {
        texto: 'Entrega: ' + fecha(asignacion.fechaLimite),
        clase: dias <= 2 ? 'text-[#F16C07]' : 'text-muted-foreground',
    };
};

const MisTareas = () => {
    const navigate = useNavigate();
    const {
        tareas, pestana, setPestana, conteos, cargando, error, errorAccion, procesando,
        iniciar, entregar,
    } = useMisTareas();

    const [porEmpezar, setPorEmpezar] = useState<TareaPropia | null>(null);
    const [porEntregar, setPorEntregar] = useState<TareaPropia | null>(null);
    const [horas, setHoras] = useState('');
    const [comentario, setComentario] = useState('');

    const cerrarEntrega = () => {
        setPorEntregar(null);
        setHoras('');
        setComentario('');
    };

    const horasValidas = Number(horas) > 0;

    const confirmarEntrega = () => {
        if (!porEntregar || !horasValidas) return;
        entregar(porEntregar.asignacion.id, Number(horas), comentario, cerrarEntrega);
    };

    // Las pestañas llevan el conteo en la etiqueta, como en el diseño
    const etiquetas = PESTANAS.map((p) => p + ' (' + conteos[p] + ')');
    const etiquetaActiva = pestana + ' (' + conteos[pestana] + ')';

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader title="Mis tareas" subtitle="Actividades asignadas por tu instructor" />

                {(error || errorAccion) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorAccion}
                    </div>
                )}

                <Tab
                    tabs={etiquetas}
                    active={etiquetaActiva}
                    onChange={(etiqueta) => setPestana(etiqueta.split(' ')[0] as PestanaTarea)}
                />

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando tus tareas...</p>
                ) : tareas.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="No tienes tareas en esta categoría"
                        description="Cuando tu instructor te asigne una actividad, aparecerá aquí."
                        action={<Btn variant="outline" onClick={() => navigate('/inicio')}>Ir al inicio</Btn>}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tareas.map((tarea) => {
                            const { asignacion } = tarea;
                            const limite = plazo(tarea);
                            return (
                                <Card key={asignacion.id} className={asignacion.vencida ? 'border-red-200' : ''}>
                                    <div className="flex items-start justify-between mb-2 gap-2">
                                        <div>
                                            <p className="font-semibold text-foreground text-[15px]">{tarea.titulo}</p>
                                            {tarea.actividad && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{tarea.actividad}</p>
                                            )}
                                        </div>
                                        <StatusBadge status={asignacion.estado} />
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1"><MapPin size={10} />{tarea.lote}</span>
                                        <span className="flex items-center gap-1"><Leaf size={10} />{tarea.cultivo}</span>
                                    </div>

                                    <p className="text-xs text-muted-foreground mb-2">Asignada por: {tarea.asignadaPor}</p>

                                    <div className={'flex items-center gap-1 text-xs font-medium mb-3 ' + limite.clase}>
                                        <Calendar size={12} />
                                        {limite.texto}
                                    </div>

                                    {asignacion.estado === 'DEVUELTA' && asignacion.comentarioInstructor && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-3">
                                            <p className="text-xs font-semibold text-red-700 mb-1">Tu instructor pidió:</p>
                                            <p className="text-xs text-red-600">{asignacion.comentarioInstructor}</p>
                                        </div>
                                    )}

                                    {asignacion.estado === 'APROBADA' && asignacion.comentarioInstructor && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-3">
                                            <p className="text-xs font-semibold text-emerald-700 mb-1">Comentario del instructor:</p>
                                            <p className="text-xs text-emerald-600">{asignacion.comentarioInstructor}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {/* El Figma pone "Ver actividad" en todas las tarjetas */}
                                        {asignacion.actividad && (
                                            <Btn
                                                variant="outline" size="sm"
                                                onClick={() => navigate('/actividades/' + asignacion.actividad!.id)}
                                                className="flex-1 justify-center"
                                            >
                                                Ver actividad
                                            </Btn>
                                        )}
                                        {asignacion.estado === 'ASIGNADA' && (
                                            <Btn size="sm" onClick={() => setPorEmpezar(tarea)} className="flex-1 justify-center">
                                                Empezar
                                            </Btn>
                                        )}
                                        {asignacion.estado === 'DEVUELTA' && (
                                            <Btn variant="outline" size="sm" onClick={() => setPorEmpezar(tarea)} className="flex-1 justify-center">
                                                Retomar
                                            </Btn>
                                        )}
                                        {['EN_PROGRESO', 'DEVUELTA'].includes(asignacion.estado) && (
                                            <Btn size="sm" onClick={() => { setPorEntregar(tarea); setHoras(''); setComentario(''); }} className="flex-1 justify-center">
                                                Entregar
                                            </Btn>
                                        )}
                                        {asignacion.estado === 'ENTREGADA' && (
                                            <span className="flex-1 self-center text-center text-xs text-muted-foreground">
                                                Esperando revisión...
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <Modal open={!!porEmpezar} onClose={() => setPorEmpezar(null)} title="Empezar tarea">
                    {porEmpezar && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Al confirmar, <strong className="text-foreground">{porEmpezar.titulo}</strong> pasará a{' '}
                                <strong className="text-foreground">En progreso</strong>. Podrás registrar
                                evidencias, insumos y herramientas.
                            </p>
                            <div className="flex gap-3">
                                <Btn
                                    disabled={procesando}
                                    onClick={() => iniciar(porEmpezar.asignacion.id, () => setPorEmpezar(null))}
                                    className="flex-1 justify-center"
                                >
                                    {procesando ? 'Guardando...' : 'Empezar'}
                                </Btn>
                                <Btn variant="outline" onClick={() => setPorEmpezar(null)} className="flex-1 justify-center">
                                    Cancelar
                                </Btn>
                            </div>
                        </div>
                    )}
                </Modal>

                <Modal open={!!porEntregar} onClose={cerrarEntrega} title="Entregar tarea">
                    {porEntregar && (
                        <div className="space-y-4">
                            <ChecklistEntrega actividadId={porEntregar.asignacion.actividad?.id} />

                            <div className="p-3 bg-[#FFF3E0] border border-[#F16C07]/30 rounded-xl flex items-start gap-2">
                                <AlertCircle size={14} className="text-[#F16C07] shrink-0 mt-0.5" />
                                <p className="text-xs text-[#E65100]">
                                    Tu instructor puede devolverte la tarea si falta evidencia de lo que hiciste.
                                </p>
                            </div>

                            <Input
                                label="Horas trabajadas"
                                type="number"
                                step="0.5"
                                value={horas}
                                onChange={setHoras}
                                required
                                placeholder="Ej: 4.5"
                            />

                            <Textarea
                                label="Comentario para el instructor"
                                rows={3}
                                value={comentario}
                                onChange={setComentario}
                                placeholder="Describe lo que hiciste, dificultades encontradas..."
                            />

                            <Btn
                                disabled={procesando || !horasValidas}
                                onClick={confirmarEntrega}
                                className="w-full justify-center"
                            >
                                {procesando ? 'Entregando...' : 'Entregar'}
                            </Btn>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default MisTareas;
