import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lotesApi } from '../api/territorio';
import type { EstadoLote } from '../types/territorio';

export function useLotes() {
    const queryClient = useQueryClient();
    const [filtroEstado, setFiltroEstado] = useState<'Todos' | EstadoLote>('Todos');

    // LECTURA
    const {
        data: lotes = [],
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
    });

    // ESCRITURA: cambiar estado
    const cambiarEstadoMutation = useMutation({
        mutationFn: ({ id, nuevoEstado }: { id: number; nuevoEstado: EstadoLote }) =>
        lotesApi.cambiarEstado(id, nuevoEstado),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['lotes'] });
        },
    });

    // ESCRITURA: eliminar
    const eliminarMutation = useMutation({
        mutationFn: (id: number) => lotesApi.eliminar(id),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['lotes'] });
        },
    });

    const handleChangeEstado = (id: number, estadoActual: EstadoLote) => {
        const estados: EstadoLote[] = ['en_preparacion', 'activo', 'inactivo'];
        const idx = estados.indexOf(estadoActual);
        const nuevoEstado = estados[(idx + 1) % estados.length];
        cambiarEstadoMutation.mutate({ id, nuevoEstado });
    };

    const handleEliminar = (id: number) => {
        if (confirm('¿Eliminar este lote?')) eliminarMutation.mutate(id);
    };

    const lotesFiltrados = lotes.filter(
        (l) => filtroEstado === 'Todos' || l.estado === filtroEstado,
    );

    return {
        lotes: lotesFiltrados,
        loading,
        error: error ? 'No se pudo cargar el listado de lotes' : null,
        filtroEstado,
        setFiltroEstado,
        handleChangeEstado,
        handleEliminar,
    };
    }