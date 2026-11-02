import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, RotateCcw, Users } from 'lucide-react';
import { asignacionesApi, revisionApi } from '../../api/instructor';
import { mensajeError } from '../../api/errores/errores';
import { Btn, Card, EmptyState, Modal, StatusBadge, Textarea } from '../ui/AgroUI';

const fecha = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'sin fecha';

/** Los aprendices asignados a la actividad, con aprobar y devolver ahí mismo. */
export function TabAprendices({ actividadId }: { actividadId: number | undefined }) {
    const queryClient = useQueryClient();
    const [devolviendoId, setDevolviendoId] = useState<number | null>(null);
    const [comentario, setComentario] = useState('');

    const asignacionesQuery = useQuery({
        queryKey: ['asignaciones-actividad', actividadId],
        queryFn: async () => (await asignacionesApi.listarPorActividad(actividadId!)).data,
        enabled: !!actividadId,
    });

    const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: ['asignaciones-actividad', actividadId] });
        queryClient.invalidateQueries({ queryKey: ['asignaciones-por-revisar'] });
        queryClient.invalidateQueries({ queryKey: ['aprendices-resumen'] });
    };

    const aprobarMutation = useMutation({
        mutationFn: (id: number) => revisionApi.aprobar(id),
        onSuccess: refrescar,
    });

    const devolverMutation = useMutation({
        mutationFn: ({ id, texto }: { id: number; texto: string }) => revisionApi.devolver(id, texto),
        onSuccess: () => { refrescar(); setDevolviendoId(null); setComentario(''); },
    });

    const asignaciones = asignacionesQuery.data ?? [];
    const errorAccion = aprobarMutation.error || devolverMutation.error;
    const procesando = aprobarMutation.isPending || devolverMutation.isPending;

    if (asignacionesQuery.isLoading) {
        return <p className="py-6 text-center text-sm text-muted-foreground">Cargando los aprendices...</p>;
    }

    if (asignaciones.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="Sin aprendices asignados"
                description="Aún no hay aprendices asignados a esta actividad"
            />
        );
    }

    return (
        <div className="space-y-3">
            {errorAccion && (
                <p className="text-sm text-red-600">
                    {mensajeError(errorAccion, 'No se pudo completar la acción.')}
                </p>
            )}

            {asignaciones.map((a) => {
                const nombre = a.aprendiz ? a.aprendiz.nombre + ' ' + a.aprendiz.apellido : 'Aprendiz';
                return (
                    <Card key={a.id}>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                    {nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">{nombre}</p>
                                    <p className="text-xs text-muted-foreground">Vence {fecha(a.fechaLimite)}</p>
                                    {!!a.horasTrabajadas && (
                                        <p className="mt-0.5 text-xs font-medium text-primary">{a.horasTrabajadas}h trabajadas</p>
                                    )}
                                    {a.comentarioAprendiz && (
                                        <p className="mt-0.5 text-xs italic text-muted-foreground">"{a.comentarioAprendiz}"</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <StatusBadge status={a.vencida ? 'overdue' : a.estado} />
                                {a.estado === 'ENTREGADA' && (
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            title="Aprobar"
                                            disabled={procesando}
                                            onClick={() => aprobarMutation.mutate(a.id)}
                                            className="cursor-pointer rounded-lg bg-emerald-100 p-1.5 text-emerald-700 transition-colors hover:bg-emerald-200 disabled:opacity-50"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            title="Devolver"
                                            disabled={procesando}
                                            onClick={() => { setDevolviendoId(a.id); setComentario(''); }}
                                            className="cursor-pointer rounded-lg bg-red-100 p-1.5 text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}

            <Modal open={devolviendoId !== null} onClose={() => setDevolviendoId(null)} title="Devolver tarea">
                <div className="space-y-3">
                    <Textarea
                        label="Comentario para el aprendiz"
                        value={comentario}
                        onChange={setComentario}
                        rows={3}
                        placeholder="Indica qué debe corregir o mejorar..."
                        required
                    />
                    <div className="flex gap-3">
                        <Btn
                            className="flex-1 justify-center"
                            variant="danger"
                            disabled={comentario.trim().length < 3 || procesando}
                            onClick={() => devolverMutation.mutate({ id: devolviendoId!, texto: comentario.trim() })}
                        >
                            Devolver
                        </Btn>
                        <Btn variant="outline" onClick={() => setDevolviendoId(null)}>Cancelar</Btn>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
