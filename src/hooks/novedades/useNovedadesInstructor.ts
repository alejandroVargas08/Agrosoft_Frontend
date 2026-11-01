import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { novedadesApi } from '../../api/novedades';
import { insumosApi } from '../../api/inventario';
import { mensajeError } from '../../api/errores/errores';
import type { EstadoNovedad } from '../../types/novedades';

export type PestanaNovedad = 'Pendientes' | 'Atendidas' | 'Descartadas';

const POR_PESTANA: Record<PestanaNovedad, EstadoNovedad> = {
    Pendientes: 'pendiente',
    Atendidas: 'atendida',
    Descartadas: 'descartada',
};

export function useNovedadesInstructor() {
    const queryClient = useQueryClient();
    const [pestana, setPestana] = useState<PestanaNovedad>('Pendientes');

    const novedadesQuery = useQuery({
        queryKey: ['novedades'],
        queryFn: async () => (await novedadesApi.listar()).data,
    });

    // Para mostrar el stock real de un insumo reportado como bajo
    const insumosQuery = useQuery({
        queryKey: ['insumos', 'todos'],
        queryFn: async () => (await insumosApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });

    const todas = novedadesQuery.data ?? [];
    const contar = (p: PestanaNovedad) => todas.filter((n) => n.estado === POR_PESTANA[p]).length;

    const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: ['novedades'] });
        queryClient.invalidateQueries({ queryKey: ['mis-fichas'] });
    };

    const atenderMutation = useMutation({
        mutationFn: ({ id, respuesta }: { id: number; respuesta: string }) =>
            novedadesApi.atender(id, respuesta),
        onSuccess: refrescar,
    });

    const descartarMutation = useMutation({
        mutationFn: ({ id, respuesta }: { id: number; respuesta: string }) =>
            novedadesApi.descartar(id, respuesta),
        onSuccess: refrescar,
    });

    const errorAccion = atenderMutation.error || descartarMutation.error;

    return {
        novedades: todas.filter((n) => n.estado === POR_PESTANA[pestana]),
        pestana,
        setPestana,
        conteos: {
            Pendientes: contar('Pendientes'),
            Atendidas: contar('Atendidas'),
            Descartadas: contar('Descartadas'),
        } as Record<PestanaNovedad, number>,
        insumo: (id: number | null) =>
            id === null ? null : (insumosQuery.data ?? []).find((i) => i.id === id) ?? null,
        cargando: novedadesQuery.isLoading,
        error: novedadesQuery.error
            ? mensajeError(novedadesQuery.error, 'No se pudieron cargar las novedades.')
            : '',
        errorAccion: errorAccion ? mensajeError(errorAccion, 'No se pudo guardar la respuesta.') : '',
        procesando: atenderMutation.isPending || descartarMutation.isPending,
        atender: (id: number, respuesta: string, alTerminar?: () => void) =>
            atenderMutation.mutate({ id, respuesta }, { onSuccess: () => alTerminar?.() }),
        descartar: (id: number, respuesta: string, alTerminar?: () => void) =>
            descartarMutation.mutate({ id, respuesta }, { onSuccess: () => alTerminar?.() }),
    };
}
