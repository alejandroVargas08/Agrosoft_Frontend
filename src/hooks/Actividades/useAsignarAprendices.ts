import { useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { aprendicesApi, asignacionesApi } from '../../api/instructor';
import { mensajeError } from '../../api/errores/errores';
import { usePermisos } from '../permisos/usePermisos';

const ASIGNAR_ACTIVIDADES = 'actividades.asignar';

export interface ProgresoActividad {
    total: number;
    aprobadas: number;
    porcentaje: number;
    /** Iniciales de los primeros aprendices, para los avatares. */
    iniciales: string[];
    restantes: number;
}

const VACIO: ProgresoActividad = { total: 0, aprobadas: 0, porcentaje: 0, iniciales: [], restantes: 0 };

/**
 * Lo que necesita la lista de actividades para asignar aprendices y mostrar
 * el avance de cada una. Solo consulta si el usuario puede asignar.
 */
export function useAsignarAprendices(actividadIds: number[]) {
    const queryClient = useQueryClient();
    const { puede } = usePermisos();
    const puedeAsignar = puede(ASIGNAR_ACTIVIDADES);

    const [actividadId, setActividadId] = useState<number | null>(null);

    const aprendicesQuery = useQuery({
        queryKey: ['aprendices'],
        queryFn: async () => (await aprendicesApi.listar()).data,
        enabled: puedeAsignar,
        staleTime: 1000 * 60 * 5,
    });

    // Una consulta por actividad visible: el backend no expone un listado conjunto
    const asignacionesQueries = useQueries({
        queries: actividadIds.map((id) => ({
            queryKey: ['asignaciones-actividad', id],
            queryFn: async () => (await asignacionesApi.listarPorActividad(id)).data,
            enabled: puedeAsignar,
            staleTime: 1000 * 60,
        })),
    });

    const progresoPorActividad = new Map<number, ProgresoActividad>();
    actividadIds.forEach((id, i) => {
        const asignaciones = asignacionesQueries[i]?.data ?? [];
        if (asignaciones.length === 0) return;
        const aprobadas = asignaciones.filter((a) => a.estado === 'APROBADA').length;
        const nombres = asignaciones
            .map((a) => a.aprendiz?.nombre ?? '')
            .filter(Boolean);
        progresoPorActividad.set(id, {
            total: asignaciones.length,
            aprobadas,
            porcentaje: Math.round((aprobadas / asignaciones.length) * 100),
            iniciales: nombres.slice(0, 4).map((n) => n.charAt(0).toUpperCase()),
            restantes: Math.max(0, nombres.length - 4),
        });
    });

    const asignarMutation = useMutation({
        mutationFn: ({ id, aprendizIds, fechaLimite }: { id: number; aprendizIds: number[]; fechaLimite?: string }) =>
            asignacionesApi.asignar(id, { aprendizIds, ...(fechaLimite ? { fechaLimite } : {}) }),
        onSuccess: (_datos, variables) => {
            queryClient.invalidateQueries({ queryKey: ['asignaciones-actividad', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['aprendices-resumen'] });
            queryClient.invalidateQueries({ queryKey: ['asignaciones-por-revisar'] });
        },
    });

    return {
        puedeAsignar,
        aprendices: aprendicesQuery.data ?? [],
        progreso: (id: number) => progresoPorActividad.get(id) ?? VACIO,
        actividadId,
        abrir: (id: number) => setActividadId(id),
        cerrar: () => { setActividadId(null); asignarMutation.reset(); },
        asignando: asignarMutation.isPending,
        errorAsignar: asignarMutation.error
            ? mensajeError(asignarMutation.error, 'No se pudo asignar la actividad.')
            : '',
        asignar: (id: number, aprendizIds: number[], fechaLimite: string, alTerminar?: () => void) =>
            asignarMutation.mutate(
                { id, aprendizIds, fechaLimite: fechaLimite || undefined },
                { onSuccess: () => alTerminar?.() },
            ),
    };
}
