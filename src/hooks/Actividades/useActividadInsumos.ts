import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actividadInsumosApi } from "../../api/actividades/actividadInsumos";
import type { CrearActividadInsumoPayload } from "../../types/actividadDetalle";
import { isAxiosError } from "axios";

export function useActividadInsumos(actividadId: number | undefined) {
    const queryClient = useQueryClient();

    const {
        data: insumos = [],
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['actividad-insumos', actividadId],
        queryFn: async () => (await actividadInsumosApi.listar(actividadId!)).data,
        enabled: !!actividadId,
    });

    const invalidar = () =>
        queryClient.invalidateQueries({ 
            queryKey: ['actividad-insumos', actividadId]
        });

    const registrarMutation = useMutation({
        mutationFn: (payload: CrearActividadInsumoPayload) =>
            actividadInsumosApi.registrar(actividadId!, payload),
        onSuccess: invalidar,
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: number) => actividadInsumosApi.eliminar(actividadId!, id),
        onSuccess: invalidar,
    });

    const mensajeError = (err: unknown) =>
        isAxiosError(err) ? err.response?.data?.message ?? 'Ha ocurrido un error' : 'Error inesperado';

    return {
        insumos,
        loading,
        error: error ? mensajeError(error) : null,
        registrar: registrarMutation.mutate,
        registrando: registrarMutation.isPending,
        errorRegistrar: registrarMutation.error ? mensajeError(registrarMutation.error) : null,
        eliminar: eliminarMutation.mutate,
        eliminando: eliminarMutation.isPending,
    };
}