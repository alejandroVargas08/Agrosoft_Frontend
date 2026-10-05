import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { actividadServiciosApi } from '../../api/actividades/actividadServicios';
import type { CrearActividadServicioPayload } from '../../types/actividadDetalle';

export function useActividadServicios(actividadId: number | undefined) {
    const queryClient = useQueryClient();

    const {
        data: servicios = [],
        isLoading: loading,
        error,
    } = useQuery({

        queryKey: ['actividad-servicios', actividadId],
        queryFn: async () => (await actividadServiciosApi.listar(actividadId!)).data,
        enabled: !!actividadId,
    });

    const invalidar = () =>
        queryClient.invalidateQueries({ queryKey: ['actividad-servicios', actividadId] });

    const registrarMutation = useMutation({
        mutationFn: (payload: CrearActividadServicioPayload) =>
        actividadServiciosApi.registrar(actividadId!, payload),
        onSuccess: invalidar,
    });

    const actualizarHorasMutation = useMutation({
        mutationFn: ({ id, horas }: { id: number; horas: number }) =>
        actividadServiciosApi.actualizarHoras(actividadId!, id, horas),
        onSuccess: invalidar,
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: number) => actividadServiciosApi.eliminar(actividadId!, id),
        onSuccess: invalidar,
    });

    const mensajeError = (err: unknown) =>
        isAxiosError(err) ? err.response?.data?.message ?? 'Ocurrió un error' : 'Error inesperado';

    return {
        servicios,
        loading,
        error: error ? mensajeError(error) : null,
        registrar: registrarMutation.mutate,
        registrando: registrarMutation.isPending,
        errorRegistrar: registrarMutation.error ? mensajeError(registrarMutation.error) : null,
        actualizarHoras: (id: number, horas: number) => actualizarHorasMutation.mutate({ id, horas }),
        actualizando: actualizarHorasMutation.isPending,
        eliminar: eliminarMutation.mutate,
        eliminando: eliminarMutation.isPending,
    };
}