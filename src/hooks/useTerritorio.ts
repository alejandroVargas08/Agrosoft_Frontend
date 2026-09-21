import { useQuery, useQueries } from '@tanstack/react-query';
import { lotesApi, sublotesApi } from '../api/territorio';
import type { SubLote } from '../types/territorio';

// Trae todos los lotes y, por cada lote, sus sublotes.
export function useTerritorio() {
    const lotesQuery = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
    });

    const lotes = lotesQuery.data ?? [];

    // Una consulta de sublotes por cada lote (misma caché que usa el resto de la app)
    const sublotesQueries = useQueries({
        queries: lotes.map((lote) => ({
            queryKey: ['sublotes', lote.id],
            queryFn: async () => (await sublotesApi.porLote(lote.id)).data,
        })),
    });

    const sublotes: SubLote[] = sublotesQueries.flatMap((q) => q.data ?? []);

    return {
        lotes,
        sublotes,
        loading: lotesQuery.isLoading,
        error: lotesQuery.error ? 'No se pudo cargar el territorio' : null,
    };
}