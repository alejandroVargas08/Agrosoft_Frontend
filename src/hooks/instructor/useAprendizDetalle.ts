import { useQuery } from '@tanstack/react-query';
import { misFichasApi, resumenAprendicesApi } from '../../api/instructor';
import { novedadesApi } from '../../api/novedades';
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

    // Las de toda la bandeja: se filtran por autor, que es como el diseño las
    // muestra en el detalle
    const novedadesQuery = useQuery({
        queryKey: ['novedades'],
        queryFn: async () => (await novedadesApi.listar()).data,
        enabled: habilitado,
        staleTime: 60_000,
    });

    // La ficha sale del programa de formacion, no de usuarios.id_ficha: esa
    // columna es texto que la persona escribio al registrarse y puede no
    // coincidir con el programa al que de verdad pertenece
    const fichasQuery = useQuery({
        queryKey: ['mis-fichas'],
        queryFn: async () => (await misFichasApi.listar()).data,
        staleTime: 5 * 60_000,
    });

    const aprendiz = (resumenQuery.data ?? []).find((a) => a.id === aprendizId) ?? null;

    const ficha =
        aprendiz && aprendiz.programaFormacionId !== null
            ? (fichasQuery.data ?? []).find((f) => f.id === aprendiz.programaFormacionId)?.ficha ?? null
            : null;

    const novedades = (novedadesQuery.data ?? [])
        .filter((n) => n.reportadaPor?.id === aprendizId)
        .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());

    // Lo más reciente arriba: es lo que el instructor quiere ver primero
    const tareas = [...(tareasQuery.data ?? [])].sort((a, b) => {
        const fa = a.creadoEn ? new Date(a.creadoEn).getTime() : 0;
        const fb = b.creadoEn ? new Date(b.creadoEn).getTime() : 0;
        return fb - fa;
    });

    const devueltas = tareas.filter((t) => t.estado === 'DEVUELTA').length;

    return {
        aprendiz,
        ficha,
        tareas,
        novedades,
        devueltas,
        cargando: resumenQuery.isLoading || tareasQuery.isLoading,
        error: tareasQuery.error
            ? mensajeError(tareasQuery.error, 'No se pudieron cargar las tareas del aprendiz.')
            : '',
        noEncontrado: !resumenQuery.isLoading && aprendiz === null,
    };
}
