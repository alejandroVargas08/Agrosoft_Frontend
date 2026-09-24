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
        mutationFn: ({ id, estado } : {id: number; estado: string}) => actividadesApi.cambiarEstado(id, estado),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['actividades', cultivoId] });
        },
    });

    const handleChangeEstado = (id: number, estadoActual: Actividad['estado']) => {
        const estados: string[] = ['Pendiente', 'En_progreso', 'Finalizada'];

        console.log("Estado que llega al hacer clic:", estadoActual);

        const estadoNormalizado = estadoActual ? estadoActual : 'Pendiente';
        const idx = estados.indexOf(estadoNormalizado);
        console.log("Índice encontrado en el arreglo:", idx);

        const siguienteIndex = idx === -1 ? 0 : (idx + 1) % estados.length;
        const nuevoEstado = estados[siguienteIndex]
        console.log("Nuevo estado calculado a enviar:", nuevoEstado)

        cambiarEstadoMutation.mutate({ id, estado: nuevoEstado});
        };



    const actividadeesFiltradas = actividades.filter((a) =>  {
        if (filtroEstado === 'Todas' || filtroEstado === 'TODAS') return true;
        
        const estadoActividad = a.estado ? a.estado.replace('_', ' ').toLowerCase() : '';
        const estadoFiltro = filtroEstado.toLowerCase()

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