import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { solicitudesApi } from '../api/usuarios/solicitudes';
import { mensajeError } from '../api/errores/errores';

export function useSolicitudes() {
    const queryClient = useQueryClient();

    const solicitudesQuery = useQuery({
        queryKey: ['solicitudes-acceso'],
        queryFn: async () => (await solicitudesApi.listar()).data,
    });

    // Los roles llegan por id; esto los traduce al nombre que ve el administrador
    const rolesQuery = useQuery({
        queryKey: ['roles'],
        queryFn: async () => (await solicitudesApi.roles()).data,
        staleTime: 1000 * 60 * 10,
    });

    const nombreRol = (rolId: number) =>
        rolesQuery.data?.find((rol) => rol.id === rolId)?.nombre ?? 'Rol #' + rolId;

    const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: ['solicitudes-acceso'] });
        queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    };

    const aprobarMutation = useMutation({
        mutationFn: (id: number) => solicitudesApi.aprobar(id),
        onSuccess: refrescar,
    });

    const rechazarMutation = useMutation({
        mutationFn: (id: number) => solicitudesApi.rechazar(id),
        onSuccess: refrescar,
    });

    const errorAccion = aprobarMutation.error || rechazarMutation.error;

    return {
        solicitudes: solicitudesQuery.data ?? [],
        total: solicitudesQuery.data?.length ?? 0,
        cargando: solicitudesQuery.isLoading,
        error: solicitudesQuery.error
            ? mensajeError(solicitudesQuery.error, 'No se pudieron cargar las solicitudes.')
            : '',
        errorAccion: errorAccion ? mensajeError(errorAccion, 'No se pudo completar la acción.') : '',
        procesando: aprobarMutation.isPending || rechazarMutation.isPending,
        nombreRol,
        aprobar: (id: number, alTerminar?: () => void) =>
            aprobarMutation.mutate(id, { onSuccess: () => alTerminar?.() }),
        rechazar: (id: number, alTerminar?: () => void) =>
            rechazarMutation.mutate(id, { onSuccess: () => alTerminar?.() }),
    };
}
