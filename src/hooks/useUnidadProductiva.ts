import { useQuery } from '@tanstack/react-query';
import { unidadesProductivasApi } from '../api/produccion';
import { useTerritorio } from './useTerritorio';

export function useUnidadProductiva(id: number) {
    const { lotes, sublotes } = useTerritorio();

    const { data: unidad, isLoading: cargando, error } = useQuery({
        queryKey: ['unidad-productiva', id],
        queryFn: async () => (await unidadesProductivasApi.obtener(id)).data,
        enabled: Number.isFinite(id),
    });

    const { data: historial = [] } = useQuery({
        queryKey: ['unidad-productiva', id, 'historial'],
        queryFn: async () => (await unidadesProductivasApi.historial(id)).data,
        enabled: Number.isFinite(id),
    });

    // Ubicación: el sublote si lo tiene, si no el lote
    const sublote = unidad?.subLoteId ? sublotes.find((s) => s.id === unidad.subLoteId) : undefined;
    const lote = unidad ? lotes.find((l) => l.id === unidad.loteId) : undefined;
    const ubicacion = sublote
        ? { nombre: sublote.nombre, areaM2: sublote.areaM2 }
        : { nombre: lote?.nombre ?? (unidad ? `Lote #${unidad.loteId}` : '—'), areaM2: lote?.areaM2 };

    return {
        unidad,
        historial,
        ubicacion,
        cargando,
        error: error ? 'No se pudo cargar la unidad productiva' : null,
    };
}