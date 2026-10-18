import { useQuery, useQueries } from '@tanstack/react-query';
import { lotesApi, sublotesApi } from '../api/territorio';
import { mensajeError, esSinPermiso } from '../api/errores/errores';
import type { SubLote } from '../types/territorio';

export function useTerritorio() {
    const lotesQuery = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        retry: (intentos, error) => !esSinPermiso(error) && intentos < 2,
    });

    const lotes = lotesQuery.data ?? [];

    const sublotesQueries = useQueries({
        queries: lotes.map((lote) => ({
            queryKey: ['sublotes', lote.id],
            queryFn: async () => (await sublotesApi.porLote(lote.id)).data,
        })),
    });

    const sublotes: SubLote[] = sublotesQueries.flatMap((q) => q.data ?? []);
    const errorSublotes = sublotesQueries.find((q) => q.error)?.error;

    return {
        lotes,
        sublotes,
        loading: lotesQuery.isLoading,
        error: lotesQuery.error
            ? mensajeError(lotesQuery.error, 'No se pudo cargar el territorio')
            : errorSublotes
                ? mensajeError(errorSublotes, 'No se pudieron cargar los sublotes')
                : null,
    };
}