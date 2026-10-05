import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActividadEvidenciaApi } from "../../api/actividades/actividadEvidencias";
import type { CrearActividadEvidenciaPayload } from "../../types/actividadDetalle";
import { isAxiosError } from "axios";

export function useActividadEvidencias(actividadId: number | undefined) {
    const queryClient = useQueryClient();

    const {
        data: evidencias = [],
        isLoading: loading,
        error,
    } = useQuery({
    queryKey: ['actividad-evidencias', actividadId],
    queryFn: async () => (await ActividadEvidenciaApi.listar(actividadId!)).data,
    enabled: !!actividadId,
});

    const invalidar = () =>
        queryClient.invalidateQueries({ queryKey: ['actividad-evidencias', actividadId] });

    const registrarMutation = useMutation({
        mutationFn: (payload: CrearActividadEvidenciaPayload) =>
            ActividadEvidenciaApi.registrar(actividadId!, payload),
    onSuccess: invalidar,
    });

    const agregarImagenMutation = useMutation({
        mutationFn: ({id, url} : {id: number; url: string}) =>
            ActividadEvidenciaApi.agregarImagen(actividadId!, id, url),
    onSuccess: invalidar,
    });

    const eliminarMutation = useMutation ({
        mutationFn: (id: number) => ActividadEvidenciaApi.eliminar(actividadId!, id), 
        onSuccess: invalidar,
    }); 

    const mensajeError = (err: unknown) =>
        isAxiosError(err) ? err.response?.data?.message ?? 'Ocurrió un error' : 'Error inesperado';

    return {
        evidencias,
        loading,
        error: error ? mensajeError(error) : null,
        registrar: registrarMutation.mutate,
        registrando: registrarMutation.isPending,
        errorRegistrar: registrarMutation.error ? mensajeError(registrarMutation.error) : null,
        agregarImagen: (id: number, url: string) => agregarImagenMutation.mutate({ id, url}),
        agregandoImagen: agregarImagenMutation.isPending,
        eliminar: eliminarMutation.mutate,
        eliminando: eliminarMutation.isPending,
    };
}