import { useQuery } from '@tanstack/react-query';
import { misFichasApi, resumenAprendicesApi } from '../../api/instructor';
import { novedadesApi } from '../../api/novedades';
import { mensajeError } from '../../api/errores/errores';
import type { Ficha } from '../../types/instructor';

/** Una ficha con los cuatro contadores del diseño. */
export interface FichaConResumen extends Ficha {
    aprendices: number;
    /**
     * Asignadas, en progreso o devueltas: lo que el aprendiz todavía debe hacer.
     *
     * El diseño deja las devueltas por fuera de este contador, pero en Mis
     * tareas las cuenta entre las pendientes. Se eligió lo segundo a propósito:
     * una tarea devuelta es trabajo abierto, y así los dos contadores dicen lo
     * mismo. No es un descuido, no lo "arregles" sin hablarlo.
     */
    tareasActivas: number;
    porRevisar: number;
    novedades: number;
}

export function useMisFichas() {
    const fichasQuery = useQuery({
        queryKey: ['mis-fichas'],
        queryFn: async () => (await misFichasApi.listar()).data,
    });

    // El resumen trae por aprendiz su ficha y sus conteos ya calculados por el
    // backend, asi que de aqui salen tres de los cuatro contadores sin pedir
    // una consulta por ficha
    const resumenQuery = useQuery({
        queryKey: ['aprendices-resumen'],
        queryFn: async () => (await resumenAprendicesApi.listar()).data,
        staleTime: 60_000,
    });

    const novedadesQuery = useQuery({
        queryKey: ['novedades', 'pendiente'],
        queryFn: async () => (await novedadesApi.listar('pendiente')).data,
        staleTime: 60_000,
    });

    const resumen = resumenQuery.data ?? [];

    // aprendizId -> fichaId, para atribuirle a cada novedad la ficha de quien la reportó
    const fichaDeAprendiz = new Map<number, number>();
    for (const aprendiz of resumen) {
        if (aprendiz.programaFormacionId !== null) {
            fichaDeAprendiz.set(aprendiz.id, aprendiz.programaFormacionId);
        }
    }

    const novedadesPorFicha = new Map<number, number>();
    for (const novedad of novedadesQuery.data ?? []) {
        const autor = novedad.reportadaPor?.id;
        if (autor === undefined) continue;
        const fichaId = fichaDeAprendiz.get(autor);
        if (fichaId === undefined) continue;
        novedadesPorFicha.set(fichaId, (novedadesPorFicha.get(fichaId) ?? 0) + 1);
    }

    const fichas: FichaConResumen[] = (fichasQuery.data ?? []).map((ficha) => {
        const suyos = resumen.filter((aprendiz) => aprendiz.programaFormacionId === ficha.id);

        return {
            ...ficha,
            aprendices: suyos.length,
            // Lo que queda abierto: el total menos lo aprobado y lo que espera revisión
            tareasActivas: suyos.reduce(
                (total, a) => total + Math.max(0, a.tareas - a.aprobadas - a.entregadas),
                0,
            ),
            porRevisar: suyos.reduce((total, a) => total + a.entregadas, 0),
            novedades: novedadesPorFicha.get(ficha.id) ?? 0,
        };
    });

    return {
        fichas,
        total: fichas.length,
        cargando: fichasQuery.isLoading || resumenQuery.isLoading,
        error: fichasQuery.error
            ? mensajeError(fichasQuery.error, 'No se pudieron cargar tus fichas.')
            : '',
    };
}
