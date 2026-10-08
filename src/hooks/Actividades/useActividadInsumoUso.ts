import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actividadInsumoUsoApi } from "../../api/actividades/actividadInsumoUso";
import type { CrearActividadInsumoUsoPayload } from "../../types/actividadDetalle";
import { isAxiosError } from "axios";

export function useActividadInsumoUso(actividadId: number | undefined) {
    const queryClient = useQueryClient();

    const {
        data: usos = [], 
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['actividad-insumo-uso', actividadId],
        queryFn: async () => (await actividadInsumoUsoApi.listar(actividadId!)).data,
        enabled: !!actividadId,
    }); 

    const registrarMutation = useMutation({
        mutationFn: (payload: CrearActividadInsumoUsoPayload) =>
            actividadInsumoUsoApi.registrar(actividadId!, payload),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['actividad-insumo-uso', actividadId] });
        queryClient.invalidateQueries({ queryKey: ['actividad-insumo-reserva', actividadId] });
    }, 
    });

    const mensajeError = (err: unknown) =>
        isAxiosError(err) ? err.response?.data?.message ?? 'Ocurrió un error' : 'Error inesperado';

    return {
        usos, 
        loading,
        error: error ? mensajeError(error) : null,
        registrar: registrarMutation.mutate,
        registrando: registrarMutation.isPending,
        errorRegistrar: registrarMutation.error ? mensajeError(registrarMutation.error) : null,
    };
}