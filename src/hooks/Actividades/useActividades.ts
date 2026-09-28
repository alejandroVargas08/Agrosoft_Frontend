import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { actividadesApi } from "../../api/actividades";
import type { Actividad } from "../../types/actividades";

export function useActividades(cultivoId: number = 1) {
    const queryClient = useQueryClient();
    const [filtroEstado, setFiltroEstado] = useState<string>('Todas');

    const {
        data: actividades = [],
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['actividades', cultivoId],
        queryFn: async () => {
            const res = await actividadesApi.listarPorCultivo(cultivoId);
            return res.data;
        },
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
        const nuevoEstado = estados[siguienteIndex];

        cambiarEstadoMutation.mutate({ id, estado: nuevoEstado });
    };

    const normalizar = (valor: string) => valor.replace('_', ' ').toLowerCase();

    const actividadeesFiltradas = actividades.filter((a) => {
        if (filtroEstado === 'Todas') return true;
        const estadoActividad = a.estado ? normalizar(a.estado) : '';
        const estadoFiltro = normalizar(filtroEstado);
        return estadoActividad === estadoFiltro;
    });

    return {
        actividades: actividadeesFiltradas,
        loading,
        error: error ? 'No se ha logrado cargar el listado de actividades' : null,
        filtroEstado,
        setFiltroEstado,
        handleChangeEstado,
    };
}