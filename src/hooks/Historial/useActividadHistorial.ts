import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { actividadHistorialApi } from "../../api/historial/historial";


export function useActividadHistorial(actividadId: number | undefined) {
    const { data: historial = [], isLoading: loading, error } = useQuery({
        queryKey: ['actividad-historial', actividadId],
        queryFn: async () => (await actividadHistorialApi.listarPorActividad(actividadId!)).data,
        enabled: !!actividadId,
    });

    return {
        historial,
        loading,
        error: error
        ? isAxiosError(error)
            ? error.response?.data?.message ?? 'No carga el historial' : 'Error inesperado' : null,
    };
}