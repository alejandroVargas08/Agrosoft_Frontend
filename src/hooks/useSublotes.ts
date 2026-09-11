import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lotesApi, sublotesApi } from '../api/territorio';
import type { EstadoLote } from '../types/territorio';

export function useSublotes() {
    const queryClient = useQueryClient();
    const [loteId, setLoteId] = useState<string>('');
    const loteIdNum = loteId ? Number(loteId) : undefined;

    // Catálogo de lotes para el selector
    const { data: lotes = [] } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
    });

    // Sublotes del lote elegido: cada lote tiene su propia entrada en caché
    const {
        data: sublotes = [],
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['sublotes', loteIdNum],
        queryFn: async () => (await sublotesApi.porLote(loteIdNum!)).data,
        enabled: !!loteIdNum, // no pide nada hasta que haya un lote seleccionado
    });

    const cambiarEstadoMutation = useMutation({
        mutationFn: ({ id, nuevoEstado }: { id: number; nuevoEstado: EstadoLote }) =>
        sublotesApi.cambiarEstado(id, nuevoEstado),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sublotes', loteIdNum] });
        },
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: number) => sublotesApi.eliminar(id),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sublotes', loteIdNum] });
        },
    });

    const handleChangeEstado = (id: number, estadoActual: EstadoLote) => {
        const estados: EstadoLote[] = ['en_preparacion', 'activo', 'inactivo'];
        const idx = estados.indexOf(estadoActual);
        cambiarEstadoMutation.mutate({ id, nuevoEstado: estados[(idx + 1) % estados.length] });
    };

    const handleEliminar = (id: number) => {
        if (confirm('¿Eliminar este sublote?')) eliminarMutation.mutate(id);
    };

    return {
        lotes,
        loteId,
        setLoteId,
        loteIdNum,
        sublotes,
        loading,
        error: error ? 'No se pudo cargar los sublotes' : null,
        handleChangeEstado,
        handleEliminar,
    };
}