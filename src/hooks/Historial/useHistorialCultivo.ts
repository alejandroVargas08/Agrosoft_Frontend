import { useQuery } from "@tanstack/react-query";
import { historialCultivoApi } from "../../api/historial/historial";
import { isAxiosError } from "axios";

export function useHistorialCultivo(cultivoId: number | undefined) {
    const { data: historial = [], isLoading: loading, error } = useQuery ({
        queryKey: ['historial-cultivo', cultivoId],
        queryFn: async() => (await historialCultivoApi.listarPorCultivo(cultivoId!)).data,
        enabled: !!cultivoId,
    });

    return {
        historial,
        loading,
        error: error
        ? isAxiosError(error)
            ? error.response?.data?.message ?? 'No carga el historial'
            : 'Error inesperado' : null,
    };
}