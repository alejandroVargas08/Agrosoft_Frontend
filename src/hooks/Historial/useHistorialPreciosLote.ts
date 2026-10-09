import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { historialPreciosLoteApi } from "../../api/historial/historial";
import { isAxiosError } from "axios";

export function useHistorialPreciosLote(loteProduccionId?: number) {
    const queryClient = useQueryClient(); 

    const { data: registros = [], isLoading: loading, error} = useQuery({
        queryKey: ['historial-precios-lote', loteProduccionId],
        queryFn: async () => 
            loteProduccionId ?
        (await historialPreciosLoteApi.listarPorLote(loteProduccionId)).data :
        (await historialPreciosLoteApi.listar()).data,
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: number) => historialPreciosLoteApi.eliminar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['historial-precios-lote'] });
        },
    });

    const mensajeError = (err: unknown) =>
        isAxiosError(err) ? err.response?.data?.message ?? 'Ocurrio un error' : 'Error';

    return {
        registros,
        loading,
        error: error ? mensajeError(error) : null,
        eliminar: eliminarMutation.mutate,
        eliminando: eliminarMutation.isPending, 
    };
}