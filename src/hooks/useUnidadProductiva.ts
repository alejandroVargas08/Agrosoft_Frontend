import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unidadesProductivasApi } from '../api/produccion';
import { loteProduccionApi } from '../api/ventas';
import { mensajeError } from '../api/errores/errores';
import type { ActualizarUnidadProductivaPayload } from '../types/produccion';
import { useTerritorio } from './useTerritorio';

export function useUnidadProductiva(id: number) {
    const queryClient = useQueryClient();
    const { lotes, sublotes } = useTerritorio();
    const habilitado = Number.isFinite(id);

    const { data: unidad, isLoading: cargando, error } = useQuery({
        queryKey: ['unidad-productiva', id],
        queryFn: async () => (await unidadesProductivasApi.obtener(id)).data,
        enabled: habilitado,
    });

    const { data: historial = [] } = useQuery({
        queryKey: ['unidad-productiva', id, 'historial'],
        queryFn: async () => (await unidadesProductivasApi.historial(id)).data,
        enabled: habilitado,
    });

    // Las cosechas son los lotes de producción de este cultivo (misma llave que Cultivos)
    const { data: cosechas = [] } = useQuery({
        queryKey: ['cosechas-cultivo', id],
        queryFn: async () => (await loteProduccionApi.listarPorCultivo(id)).data,
        enabled: habilitado,
    });

    const editarMutation = useMutation({
        mutationFn: (data: ActualizarUnidadProductivaPayload) => unidadesProductivasApi.actualizar(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unidad-productiva', id] });
            queryClient.invalidateQueries({ queryKey: ['unidades-productivas'] });
        },
    });

    // Ubicación: el sublote si lo tiene, si no el lote. El área propia de la unidad manda.
    const sublote = unidad?.subLoteId ? sublotes.find((s) => s.id === unidad.subLoteId) : undefined;
    const lote = unidad ? lotes.find((l) => l.id === unidad.loteId) : undefined;
    const ubicacion = {
        nombre: sublote?.nombre ?? lote?.nombre ?? (unidad ? `Lote #${unidad.loteId}` : '—'),
        areaM2: unidad?.areaM2 ?? sublote?.areaM2 ?? lote?.areaM2,
    };

    return {
        unidad,
        historial,
        cosechas,
        ubicacion,
        cargando,
        error: error ? 'No se pudo cargar la unidad productiva' : null,
        editar: (data: ActualizarUnidadProductivaPayload, alTerminar?: () => void) =>
            editarMutation.mutate(data, { onSuccess: () => alTerminar?.() }),
        guardando: editarMutation.isPending,
        errorEdicion: editarMutation.error ? mensajeError(editarMutation.error, 'No se pudo guardar la unidad.') : '',
        limpiarEdicion: () => editarMutation.reset(),
    };
}
