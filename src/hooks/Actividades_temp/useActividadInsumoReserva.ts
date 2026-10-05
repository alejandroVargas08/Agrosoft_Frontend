import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actividadInsumoReservaApi } from "../../api/actividades/actividadInsumoReserva";
import type { CrearActividadInsumoReservaPayload } from "../../types/actividadDetalle";
import { isAxiosError } from "axios";

export function useActividadInsumoReserva(actividadId: number | undefined) {
    const queryClient = useQueryClient();

    const {
        data: reservas = [],
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['actividad-insumo-reserva', actividadId],
        queryFn: async () => (await actividadInsumoReservaApi.listar(actividadId!)).data,
        enabled: !!actividadId,
    });

    const invalidar = () =>
        queryClient.invalidateQueries({ 
            queryKey: ['actividad-insumo-reserva', actividadId] });
    
    const reservarMutation = useMutation({
        mutationFn: (payload: CrearActividadInsumoReservaPayload) =>
            actividadInsumoReservaApi.reservar(actividadId!, payload),
        onSuccess: invalidar,
    });

    const ajustarMutation = useMutation({
        mutationFn: ({ id, cantidadReserva} : {id: number; cantidadReserva: number}) =>
            actividadInsumoReservaApi.ajustarCantidad(actividadId!, id, cantidadReserva),
        onSuccess: invalidar,
    });

    const liberarMutation = useMutation({
        mutationFn: (id: number) => actividadInsumoReservaApi.liberar(actividadId!, id),
        onSuccess: invalidar,
    })

    const mensajeError = (err: unknown) =>
        isAxiosError(err) ? err.response?.data?.message ?? 'Ocurrió un error' : 'Error inesperado';

    return {
        reservas,
        loading,
        error: error ? mensajeError(error) : null,
        reservar: reservarMutation.mutate,
        reservando: reservarMutation.isPending,
        errorReservar: reservarMutation.error ? mensajeError(reservarMutation.error) : null,
        ajustarCantidad: (id: number, cantidadReserva: number) =>
            ajustarMutation.mutate({ id, cantidadReserva}),
        ajustando: ajustarMutation.isPending,
        liberar: liberarMutation.mutate,
        liberando: liberarMutation.isPending,
    };
}