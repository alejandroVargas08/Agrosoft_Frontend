import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActividadEvidenciaApi } from "../../api/actividades/actividadEvidencias";
import { misTareasApi } from "../../api/instructor";
import { usePermisos } from "../permisos/usePermisos";
import { PERMISO_EJECUTAR_ACTIVIDADES } from "../instructor/permisos";
import type { CrearActividadEvidenciaPayload } from "../../types/actividadDetalle";
import { isAxiosError } from "axios";

export function useActividadEvidencias(actividadId: number | undefined) {
    const queryClient = useQueryClient();
    const { puede } = usePermisos();

    /**
     * La entrega propia del aprendiz para esta actividad, si tiene una.
     *
     * Se usa para estampar lo que suba, de modo que en Por revisar el
     * instructor vea las fotos de ese aprendiz y no las de todo el grupo.
     * El instructor no tiene entrega: lo que sube el queda en la actividad.
     */
    const { data: misTareas } = useQuery({
        queryKey: ['mis-tareas'],
        queryFn: async () => (await misTareasApi.listar()).data,
        enabled: puede(PERMISO_EJECUTAR_ACTIVIDADES),
        staleTime: 1000 * 60,
    });

    const miEntregaId = (misTareas ?? []).find(
        (t) => t.actividad?.id === actividadId,
    )?.id;

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
            ActividadEvidenciaApi.registrar(actividadId!, {
                ...payload,
                asignacionId: payload.asignacionId ?? miEntregaId,
            }),
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