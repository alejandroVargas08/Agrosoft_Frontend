import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { solicitudesApi } from '../api/usuarios/solicitudes';
import { programasFormacionApi } from '../api/programa_formacion/programasFormacion';
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

    // Para mostrar las fichas pedidas por su número y elegir las que quedan a cargo
    const programasQuery = useQuery({
        queryKey: ['programas-todos'],
        queryFn: async () => (await programasFormacionApi.listarTodos()).data,
        staleTime: 1000 * 60 * 5,
    });

    const nombreRol = (rolId: number) =>
        rolesQuery.data?.find((rol) => rol.id === rolId)?.nombre ?? 'Rol #' + rolId;

    const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: ['solicitudes-acceso'] });
        queryClient.invalidateQueries({ queryKey: ['usuarios'] });
        // El contador del menú lateral y el panel del administrador
        queryClient.invalidateQueries({ queryKey: ['admin'] });
    };

    const aprobarMutation = useMutation({
        mutationFn: ({ id, fichas }: { id: number; fichas?: number[] }) => solicitudesApi.aprobar(id, fichas),
        onSuccess: refrescar,
    });

    const rechazarMutation = useMutation({
        mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
            solicitudesApi.rechazar(id, motivo),
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
        programas: programasQuery.data ?? [],
        aprobar: (id: number, fichas: number[] | undefined, alTerminar?: () => void) =>
            aprobarMutation.mutate({ id, fichas }, { onSuccess: () => alTerminar?.() }),
        rechazar: (id: number, motivo: string, alTerminar?: () => void) =>
            rechazarMutation.mutate({ id, motivo }, { onSuccess: () => alTerminar?.() }),
    };
}
