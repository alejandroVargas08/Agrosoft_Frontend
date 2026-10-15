import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios"
import { lotesProduccionApi } from "../api/lotesProduccion";

const mensajeError = (err: unknown): string => {
    if (!isAxiosError(err)) return 'Error inesperado';
    const msg = (err.response?.data as { message?: string | string[] } | undefined)?.message;
    return Array.isArray(msg) ? msg.join(', ') : msg ?? 'Ocurrió un error';
};

export function useLotesProduccion(cultivoId?: number) {
    const queryClient = useQueryClient();
    const { data: lotes = [], isLoading: loading, error } = useQuery({
        queryKey: ['lotesProduccion', cultivoId],
        queryFn: async() => (await lotesProduccionApi.listar(cultivoId)).data,
    }); 

    const descontarMutation = useMutation({
        mutationFn: ({ id, cantidadKg}: {id: number; cantidadKg: number}) =>
            lotesProduccionApi.descontarStock(id, cantidadKg),
        onSuccess: () => queryClient.invalidateQueries({ 
            queryKey: ['lotesProduccion'] 
        }),
    });

    return {
        lotes,
        loading, 
        error: error ? mensajeError(error): null,
        descontarStock: (id: number, cantidadKg: number, onSuccess?: () => void) =>
            descontarMutation.mutate({ id, cantidadKg}, {onSuccess}),
        descontando: descontarMutation.isPending,
        errorDescontar: descontarMutation.error ? mensajeError(descontarMutation.error) : null,
        limpiarErrorDescontar: () => descontarMutation.reset(),
    };
}