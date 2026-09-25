import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cultivosApi } from "../../api/cultivo/cultivos";
import type { ActualizarCultivoPayload } from "../../types/cultivos";

export function useCultivoCard(id: number | undefined) {
    const queryClient = useQueryClient();

    const {data: cultivo, isLoading: loading} = useQuery ({
        queryKey: ['cultivo', id],
        queryFn: async () => (await cultivosApi.obtenerPorId(id!)).data,
        enabled: !!id, 
    });

    const actualizarMutation = useMutation({
        mutationFn: (payload: ActualizarCultivoPayload) => cultivosApi.actualizar(id!, payload),
        onSuccess: (res) => {
            {/* Actualiza la caché al instante con la resp del backend */}
            queryClient.setQueryData(['cultivo', id], res.data);
            {/* Marca como desactualizada para que refresque */}
            queryClient.invalidateQueries({ queryKey: ['cultivos', res.data.loteId]});
        },
    });

    return {
        cultivo,
        loading,
        actualizar: actualizarMutation.mutate,
        actualizando: actualizarMutation.isPending,
    };
}