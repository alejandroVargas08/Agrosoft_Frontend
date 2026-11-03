import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actividadResponsablesApi } from '../../api/actividades/actividadResponsables';
import { mensajeError } from '../../api/errores/errores';
import type { CrearActividadResponsablePayload } from '../../types/actividadDetalle';

/** Quien trabajo en la actividad, con sus horas y lo que costo esa mano de obra. */
export function useActividadResponsables(actividadId: number | undefined) {
    const queryClient = useQueryClient();

    const { data: responsables = [], isLoading: cargando, error } = useQuery({
        queryKey: ['actividad-responsables', actividadId],
        queryFn: async () => (await actividadResponsablesApi.listar(actividadId!)).data,
        enabled: !!actividadId,
    });

    const invalidar = () =>
        queryClient.invalidateQueries({ queryKey: ['actividad-responsables', actividadId] });

    const registrarMutation = useMutation({
        mutationFn: (payload: CrearActividadResponsablePayload) =>
            actividadResponsablesApi.registrar(actividadId!, payload),
        onSuccess: invalidar,
    });

    const actualizarHorasMutation = useMutation({
        mutationFn: ({ id, horas }: { id: number; horas: number }) =>
            actividadResponsablesApi.actualizarHoras(actividadId!, id, horas),
        onSuccess: invalidar,
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: number) => actividadResponsablesApi.eliminar(actividadId!, id),
        onSuccess: invalidar,
    });

    return {
        responsables,
        cargando,
        error: error ? mensajeError(error, 'No se pudieron cargar los responsables.') : null,
        registrar: registrarMutation.mutate,
        registrando: registrarMutation.isPending,
        errorRegistrar: registrarMutation.error
            ? mensajeError(registrarMutation.error, 'No se pudo registrar el responsable.')
            : null,
        actualizarHoras: (id: number, horas: number) => actualizarHorasMutation.mutate({ id, horas }),
        actualizando: actualizarHorasMutation.isPending,
        eliminar: eliminarMutation.mutate,
        eliminando: eliminarMutation.isPending,
    };
}
