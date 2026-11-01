import { useQuery } from '@tanstack/react-query';
import { resumenAprendicesApi } from '../../api/instructor';
import { mensajeError } from '../../api/errores/errores';

export function useAprendizDetalle(aprendizId: number) {
    const habilitado = Number.isFinite(aprendizId);

    // El resumen viene del listado completo: el backend no expone un endpoint
    // de un solo aprendiz, y la lista ya está en caché desde el detalle de ficha.
    const resumenQuery = useQuery({
        queryKey: ['aprendices-resumen', 'todos'],
        queryFn: async () => (await resumenAprendicesApi.listar()).data,
        enabled: habilitado,
    });

    const tareasQuery = useQuery({
        queryKey: ['aprendiz-tareas', aprendizId],
        queryFn: async () => (await resumenAprendicesApi.tareas(aprendizId)).data,
        enabled: habilitado,
    });

    const aprendiz = (resumenQuery.data ?? []).find((a) => a.id === aprendizId) ?? null;

    // Lo más reciente arriba: es lo que el instructor quiere ver primero
    const tareas = [...(tareasQuery.data ?? [])].sort((a, b) => {
        const fa = a.creadoEn ? new Date(a.creadoEn).getTime() : 0;
        const fb = b.creadoEn ? new Date(b.creadoEn).getTime() : 0;
        return fb - fa;
    });

    const devueltas = tareas.filter((t) => t.estado === 'DEVUELTA').length;

    return {
        aprendiz,
        tareas,
        devueltas,
        cargando: resumenQuery.isLoading || tareasQuery.isLoading,
        error: tareasQuery.error
            ? mensajeError(tareasQuery.error, 'No se pudieron cargar las tareas del aprendiz.')
            : '',
        noEncontrado: !resumenQuery.isLoading && aprendiz === null,
    };
}
