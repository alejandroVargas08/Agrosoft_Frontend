import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, RotateCcw, Users } from 'lucide-react';
import { asignacionesApi, revisionApi } from '../../api/instructor';
import { mensajeError } from '../../api/errores/errores';
import { StatusBadge } from '../ui/AgroUI';

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
        return <p className="text-sm text-neutral-500 py-6 text-center">Cargando los aprendices...</p>;
    }

    if (asignaciones.length === 0) {
        return (
            <div className="py-10 text-center">
                <div className="inline-flex p-3 bg-[#f0f4f1] rounded-2xl mb-3">
                    <Users className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm font-semibold text-neutral-900 mb-1">Sin aprendices asignados</p>
                <p className="text-xs text-neutral-500">
                    Asígnalos desde la lista de actividades, con el botón Asignar de la tarjeta.
                </p>
            </div>
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
                    <div key={a.id} className="p-4 bg-[#f0f4f1] rounded-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 shrink-0 rounded-full bg-[#2d7a3e]/15 text-[#2d7a3e] font-bold text-sm grid place-items-center">
                                    {nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900 truncate">{nombre}</p>
                                    <p className="text-xs text-neutral-500">
                                        Entrega {fecha(a.fechaLimite)}
                                        {a.horasTrabajadas ? ' · ' + a.horasTrabajadas + 'h trabajadas' : ''}
                                    </p>
                                    {a.comentarioAprendiz && (
                                        <p className="text-xs text-neutral-500 italic mt-0.5">"{a.comentarioAprendiz}"</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <StatusBadge status={a.vencida ? 'overdue' : a.estado} />
                                {a.estado === 'ENTREGADA' && (
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            title="Aprobar"
                                            disabled={procesando}
                                            onClick={() => aprobarMutation.mutate(a.id)}
                                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            title="Devolver"
                                            disabled={procesando}
                                            onClick={() => { setDevolviendoId(a.id); setComentario(''); }}
                                            className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {devolviendoId === a.id && (
                            <div className="mt-3 pt-3 border-t border-neutral-200">
                                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                                    Qué debe corregir <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    rows={2}
                                    placeholder="El aprendiz tiene que saber qué le faltó."
                                    className="w-full rounded-xl border border-neutral-200 py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d7a3e] resize-none"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setDevolviendoId(null); setComentario(''); }}
                                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        disabled={comentario.trim().length < 3 || procesando}
                                        onClick={() => devolverMutation.mutate({ id: a.id, texto: comentario.trim() })}
                                        className="px-4 py-1.5 rounded-xl text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                                    >
                                        Devolver
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
