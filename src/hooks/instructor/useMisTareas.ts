import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { misTareasApi } from '../../api/instructor';
import { lotesApi } from '../../api/territorio';
import { cultivosApi } from '../../api/cultivo/cultivos';
import { mensajeError } from '../../api/errores/errores';
import type { Asignacion, EstadoAsignacion } from '../../types/instructor';

export type PestanaTarea = 'Pendientes' | 'Entregadas' | 'Aprobadas';

// Una tarea devuelta sigue siendo pendiente: hay que volver a trabajarla
const POR_PESTANA: Record<PestanaTarea, EstadoAsignacion[]> = {
    Pendientes: ['ASIGNADA', 'EN_PROGRESO', 'DEVUELTA'],
    Entregadas: ['ENTREGADA'],
    Aprobadas: ['APROBADA'],
};

export interface TareaPropia {
    asignacion: Asignacion;
    titulo: string;
    actividad: string;
    lote: string;
    cultivo: string;
    asignadaPor: string;
    diasParaEntregar: number | null;
}

const diasHasta = (fecha: string | null): number | null => {
    if (!fecha) return null;
    const limite = new Date(fecha);
    limite.setHours(0, 0, 0, 0);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((limite.getTime() - hoy.getTime()) / 86400000);
};

export function useMisTareas() {
    const queryClient = useQueryClient();
    const [pestana, setPestana] = useState<PestanaTarea>('Pendientes');

    const tareasQuery = useQuery({
        queryKey: ['mis-tareas'],
        queryFn: async () => (await misTareasApi.listar()).data,
    });

    const lotesQuery = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });

    // GET /cultivos exige loteId: se piden solo los lotes de mis tareas
    const lotesEnTareas = useMemo(() => {
        const ids = new Set<number>();
        for (const t of tareasQuery.data ?? []) if (t.actividad) ids.add(t.actividad.loteId);
        return [...ids];
    }, [tareasQuery.data]);

    const cultivosPorLote = useQueries({
        queries: lotesEnTareas.map((loteId) => ({
            queryKey: ['cultivos', loteId],
            queryFn: async () => (await cultivosApi.listarPorLote(loteId)).data,
            staleTime: 1000 * 60 * 5,
        })),
    });
    const cultivos = cultivosPorLote.flatMap((c) => c.data ?? []);

    const nombreLote = new Map((lotesQuery.data ?? []).map((l) => [l.id, l.nombre]));
    const nombreCultivo = new Map(cultivos.map((c) => [c.id, c.nombreCultivo]));

    const todas: TareaPropia[] = (tareasQuery.data ?? []).map((asignacion) => {
        const actividad = asignacion.actividad;
        const quien = asignacion.asignadoPor;
        return {
            asignacion,
            titulo: actividad?.nombre ?? 'Actividad',
            actividad: actividad
                ? actividad.subtipo
                    ? actividad.tipo + ' — ' + actividad.subtipo
                    : actividad.tipo
                : '',
            lote: actividad ? nombreLote.get(actividad.loteId) ?? 'Lote #' + actividad.loteId : '—',
            cultivo: actividad
                ? nombreCultivo.get(actividad.cultivoId) ?? 'Cultivo #' + actividad.cultivoId
                : '—',
            asignadaPor: quien ? quien.nombre + ' ' + quien.apellido : 'Tu instructor',
            diasParaEntregar: diasHasta(asignacion.fechaLimite),
        };
    });

    const contar = (p: PestanaTarea) =>
        todas.filter((t) => POR_PESTANA[p].includes(t.asignacion.estado)).length;

    const visibles = todas.filter((t) => POR_PESTANA[pestana].includes(t.asignacion.estado));

    const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: ['mis-tareas'] });
        queryClient.invalidateQueries({ queryKey: ['actividades-alertas'] });
    };

    const iniciarMutation = useMutation({
        mutationFn: (id: number) => misTareasApi.iniciar(id),
        onSuccess: refrescar,
    });

    const entregarMutation = useMutation({
        mutationFn: ({ id, horasTrabajadas, comentario }: { id: number; horasTrabajadas: number; comentario?: string }) =>
            misTareasApi.entregar(id, { horasTrabajadas, comentario }),
        onSuccess: refrescar,
    });

    const errorAccion = iniciarMutation.error || entregarMutation.error;

    return {
        tareas: visibles,
        /** Todas, sin filtrar por pestaña: lo usa el Inicio del aprendiz. */
        todas,
        pestana,
        setPestana,
        conteos: {
            Pendientes: contar('Pendientes'),
            Entregadas: contar('Entregadas'),
            Aprobadas: contar('Aprobadas'),
        } as Record<PestanaTarea, number>,
        cargando: tareasQuery.isLoading,
        error: tareasQuery.error
            ? mensajeError(tareasQuery.error, 'No se pudieron cargar tus tareas.')
            : '',
        errorAccion: errorAccion ? mensajeError(errorAccion, 'No se pudo completar la acción.') : '',
        procesando: iniciarMutation.isPending || entregarMutation.isPending,
        iniciar: (id: number, alTerminar?: () => void) =>
            iniciarMutation.mutate(id, { onSuccess: () => alTerminar?.() }),
        entregar: (id: number, horasTrabajadas: number, comentario: string, alTerminar?: () => void) =>
            entregarMutation.mutate(
                { id, horasTrabajadas, comentario: comentario.trim() || undefined },
                { onSuccess: () => alTerminar?.() },
            ),
    };
}
