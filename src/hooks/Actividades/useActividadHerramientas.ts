import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actividadHerramientasApi } from "../../api/actividades/actividadHerramientas";
import type { CrearActividadHerramientaPayload } from "../../types/actividadDetalle";
import { isAxiosError } from "axios";

export function useActividadHerramientas(actividadId: number | undefined) {
    const queryClient = useQueryClient();

    const {
        data: herramientas = [],
        isLoading: loading,
        error,
    } = useQuery({
    queryKey: ['actividad-herramientas', actividadId],
    queryFn: async () => (await actividadHerramientasApi.listar(actividadId!)).data,
    enabled: !!actividadId,
    });

    const invalidar = () =>
        queryClient.invalidateQueries({ queryKey: ['actividad-herramientas', actividadId] });

    const asignarMutation = useMutation({
        mutationFn: (payload: CrearActividadHerramientaPayload) =>
            actividadHerramientasApi.asignar(actividadId!, payload),
    onSuccess: invalidar,
    });

    const reestimarMutation = useMutation({
        mutationFn: ({id, horasEstimadas} : {id: number; horasEstimadas: number}) => actividadHerramientasApi.reestimar(actividadId!, id, horasEstimadas),
        onSuccess: invalidar,
    }); 

    const quitarMutation = useMutation({
        mutationFn: (id: number) => actividadHerramientasApi.quitar(actividadId!, id),
        onSuccess: invalidar,
    });

    const mensajeError = (err: unknown) => 
        isAxiosError(err) ? err.response?.data?.message ?? 'Ocurrió un error' : 'Error inesperado';

    return {
        herramientas, 
        loading,
        error: error ? mensajeError(error) : null,
        asignar: asignarMutation.mutate,
        asignado: asignarMutation.isPending,
        errorAsignar: asignarMutation.error ? mensajeError(asignarMutation.error) : null,
        reestimar: (id: number, horasEstimadas: number) =>
            reestimarMutation.mutate({ id, horasEstimadas}),
        reestimando: reestimarMutation.isPending,
        quitar: quitarMutation.mutate,
        quitando: quitarMutation.isPending,
    }; 
}