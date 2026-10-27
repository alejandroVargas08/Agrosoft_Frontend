import { useQuery } from '@tanstack/react-query';
import { resumenAprendicesApi } from '../api/instructor';
import { mensajeError } from '../api/errores/errores';
import type { ResumenAprendiz } from '../types/instructor';

export interface AprendizConDesempeno extends ResumenAprendiz {
    /** Porcentaje de sus tareas que ya están aprobadas. */
    avance: number;
    nombreCompleto: string;
}

/** Alimenta la pestaña Aprendices de Reportes. Reusa el mismo endpoint y la
 *  misma caché que el panel del instructor, así que no es una consulta extra. */
export function useReporteAprendices(habilitado: boolean) {
    const resumenQuery = useQuery({
        queryKey: ['aprendices-resumen'],
        queryFn: async () => (await resumenAprendicesApi.listar()).data,
        enabled: habilitado,
        staleTime: 1000 * 60 * 2,
    });

    const aprendices: AprendizConDesempeno[] = (resumenQuery.data ?? []).map((a) => ({
        ...a,
        nombreCompleto: (a.nombre + ' ' + a.apellido).trim(),
        avance: a.tareas > 0 ? Math.round((a.aprobadas / a.tareas) * 100) : 0,
    }));

    // Se ordenan por aprobadas, que es lo que el instructor quiere ver primero
    aprendices.sort((x, y) => y.aprobadas - x.aprobadas || y.tareas - x.tareas);

    const sumar = (campo: keyof ResumenAprendiz) =>
        aprendices.reduce((total, a) => total + (Number(a[campo]) || 0), 0);

    return {
        aprendices,
        totales: {
            aprendices: aprendices.length,
            tareas: sumar('tareas'),
            aprobadas: sumar('aprobadas'),
            entregadas: sumar('entregadas'),
            vencidas: sumar('vencidas'),
            horas: sumar('horas'),
        },
        cargando: resumenQuery.isLoading,
        error: resumenQuery.error
            ? mensajeError(resumenQuery.error, 'No se pudo cargar el desempeño de los aprendices.')
            : '',
    };
}
