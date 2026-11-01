import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Actividad } from "../../types/actividades";
import { actividadesApi } from "../../api/actividades/actividades";
import { esSinPermiso, mensajeError } from "../../api/errores/errores";

export function useActividades(cultivoId: number | null) {
    const queryClient = useQueryClient();
    const [filtroEstado, setFiltroEstado] = useState<string>('Todas');

    const {
        data: actividades = [],
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['actividades', cultivoId],
        // Sin cultivo se listan todas las visibles, como en el diseño: antes la
        // pantalla obligaba a elegir lote y cultivo antes de mostrar nada
        queryFn: async () =>
            cultivoId === null
                ? (await actividadesApi.listar()).data
                : (await actividadesApi.listarPorCultivo(cultivoId)).data,
        retry: (intentos, err) => !esSinPermiso(err) && intentos < 2,
    });

    const cambiarEstadoMutation = useMutation({
        mutationFn: ({ id, estado }: { id: number; estado: string }) => actividadesApi.cambiarEstado(id, estado),
        onMutate: async ({ id, estado }) => {
            await queryClient.cancelQueries({ queryKey: ['actividades', cultivoId] });
            const actividadesPrevias = queryClient.getQueryData<Actividad[]>(['actividades', cultivoId]);
            queryClient.setQueryData<Actividad[]>(['actividades', cultivoId], (old = []) =>
                old.map((a) => (a.id === id ? { ...a, estado: estado as Actividad['estado'] } : a))
            );
            return { actividadesPrevias };
        },
        onError: (_err, _variables, context) => {
            if (context?.actividadesPrevias) {
                queryClient.setQueryData(['actividades', cultivoId], context.actividadesPrevias);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['actividades', cultivoId] });
        },
    });

    const handleChangeEstado = (id: number, estadoActual: Actividad['estado']) => {
        const estados: string[] = ['Pendiente', 'En_progreso', 'Finalizada'];
        const estadoNormalizado = estadoActual ? estadoActual : 'Pendiente';
        const idx = estados.indexOf(estadoNormalizado);
        const siguienteIndex = idx === -1 ? 0 : (idx + 1) % estados.length;
        cambiarEstadoMutation.mutate({ id, estado: estados[siguienteIndex] });
    };

    const normalizar = (valor: string) => valor.replace('_', ' ').toLowerCase();
    const actividadesFiltradas = actividades.filter((a) => {
        if (filtroEstado === 'Todas') return true;
        const estadoActividad = a.estado ? normalizar(a.estado) : '';
        return estadoActividad === normalizar(filtroEstado);
    });

    const errorLista = error ? mensajeError(error, 'No se ha logrado cargar el listado de actividades') : null;
    const errorEstado = cambiarEstadoMutation.error
        ? mensajeError(cambiarEstadoMutation.error, 'No se pudo cambiar el estado')
        : null;

    return {
        actividades: actividadesFiltradas,
        loading,
        error: errorLista ?? errorEstado,
        filtroEstado,
        setFiltroEstado,
        handleChangeEstado,
    };
}
