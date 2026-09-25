import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cultivosApi } from "../../api/cultivo/cultivos";
import { isAxiosError } from "axios";

export function useCultivos (loteId: number | undefined) {
    const queryClient = useQueryClient();

    const {
        data: cultivos = [],
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['cultivos', loteId],
        queryFn: async () => (await cultivosApi.listarPorLote(loteId!)).data,
        enabled: !!loteId, // Si no hay loteId, no pasa la petición
    });

    const invalidar = () => queryClient.invalidateQueries({ queryKey: ['cultivos', loteId]});

    const finalizarMutation = useMutation({
        mutationFn: ({ id, fechaFinalizacion}: { id: number; fechaFinalizacion: string}) =>
            cultivosApi.finalizar(id, fechaFinalizacion),
        onSuccess: invalidar,
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: number) => cultivosApi.eliminar(id),
        onSuccess: invalidar,
    });

    const handleFinalizar = (id: number, fechaFinalizacion: string) => {
        finalizarMutation.mutate({ id, fechaFinalizacion});
    };

    const handleEliminar = (id: number) => {
        eliminarMutation.mutate(id);
    };

    const mensajeError = (err: unknown) =>
        isAxiosError(err) ? err.response?.data?.message ?? 'Ocurrió un error' : 'Error Inesperado';

    return {
        cultivos,
        loading,
        error: error ? mensajeError(error) : null,
        handleFinalizar,
        finalizando: finalizarMutation.isPending,
        errorFinalizar: finalizarMutation.error ? mensajeError(finalizarMutation.error) : null,
        handleEliminar,
        eliminando: eliminarMutation.isPending,
        errorEliminar: eliminarMutation.error ? mensajeError (eliminarMutation.error) : null,
    };
}