import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cultivosApi } from '../../api/cultivo/cultivos';
import type { ActualizarCultivoPayload } from '../../types/cultivos';
import { actividadesApi } from '../../api/actividades/actividades';
import { loteProduccionApi } from '../../api/ventas';
import { lotesApi, sublotesApi } from '../../api/territorio';
import { mensajeError } from '../../api/errores/errores';

export interface MetricasCultivo {
    /** Suma de los kilos de todas las cosechas. */
    totalKg: number;
    cosechas: number;
    stockDisponibleKg: number;
    ultimaCosecha: string | null;
    /** Kilos por hectárea del lote. null si no se conoce el área. */
    rendimientoKgHa: number | null;
    /** Lo que valdría la producción al precio sugerido de cada cosecha. */
    ingresoEstimado: number;
    /** Promedio ponderado del precio sugerido por kilo. */
    precioReferencialKg: number | null;
    costoTotal: number;
    /** (ingreso − costo) / costo, en porcentaje. null si no hay costo. */
    retornoPorcentaje: number | null;
}

export function useCultivoDetalle(cultivoId: number | undefined) {
    const queryClient = useQueryClient();
    const [modalEditar, setModalEditar] = useState(false);
    const habilitado = cultivoId !== undefined && !Number.isNaN(cultivoId);

    const cultivoQuery = useQuery({
        queryKey: ['cultivo', cultivoId],
        queryFn: async () => (await cultivosApi.obtenerPorId(cultivoId!)).data,
        enabled: habilitado,
    });

    const cosechasQuery = useQuery({
        queryKey: ['cosechas-cultivo', cultivoId],
        queryFn: async () => (await loteProduccionApi.listarPorCultivo(cultivoId!)).data,
        enabled: habilitado,
    });

    const actividadesQuery = useQuery({
        queryKey: ['actividades-cultivo', cultivoId],
        queryFn: async () => (await actividadesApi.listarPorCultivo(cultivoId!)).data,
        enabled: habilitado,
    });

    const lotesQuery = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });

    const cultivo = cultivoQuery.data ?? null;
    const cosechas = cosechasQuery.data ?? [];

    // Los sublotes del lote: para mostrar la ubicación y para moverlo de sublote
    // al editar (de lote no se mueve: invalidaría sus cosechas y actividades)
    const sublotesQuery = useQuery({
        queryKey: ['sublotes', cultivo?.loteId],
        queryFn: async () => (await sublotesApi.porLote(cultivo!.loteId)).data,
        enabled: cultivo != null,
        staleTime: 1000 * 60 * 5,
    });
    const lote = (lotesQuery.data ?? []).find((l) => l.id === cultivo?.loteId) ?? null;

    const totalKg = cosechas.reduce((s, c) => s + (c.cantidadKg || 0), 0);
    const ingresoEstimado = cosechas.reduce((s, c) => s + (c.cantidadKg || 0) * (c.precioSugeridoKg || 0), 0);
    // Si todavía no hay gastos reales, el retorno se mide contra lo estimado
    const costoTotal = cultivo?.costoTotal || cultivo?.costoEstimado || 0;
    const areaHa = lote?.areaHa && lote.areaHa > 0 ? lote.areaHa : null;

    const metricas: MetricasCultivo = {
        totalKg,
        cosechas: cosechas.length,
        stockDisponibleKg: cosechas.reduce((s, c) => s + (c.stockDisponibleKg || 0), 0),
        ultimaCosecha: cosechas
            .map((c) => c.fechaCosecha)
            .filter((f): f is string => !!f)
            .sort()
            .pop() ?? null,
        rendimientoKgHa: areaHa ? Math.round(totalKg / areaHa) : null,
        ingresoEstimado,
        precioReferencialKg: totalKg > 0 ? Math.round(ingresoEstimado / totalKg) : null,
        costoTotal,
        retornoPorcentaje: costoTotal > 0 ? Math.round(((ingresoEstimado - costoTotal) / costoTotal) * 100) : null,
    };

    const editarMutation = useMutation({
        mutationFn: (data: ActualizarCultivoPayload) => cultivosApi.actualizar(cultivoId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cultivo', cultivoId] });
            // La lista de cultivos del lote muestra el nombre y el tipo
            queryClient.invalidateQueries({ queryKey: ['cultivos'] });
        },
    });

    const error = cultivoQuery.error || cosechasQuery.error;
    // El registro de cosechas vive en components/cultivos/RegistrarCosechaModal

    return {
        cultivo,
        lote,
        cosechas,
        actividades: actividadesQuery.data ?? [],
        metricas,
        cargando: cultivoQuery.isLoading,
        error: error ? mensajeError(error, 'No se pudo cargar el cultivo.') : '',

        sublotes: sublotesQuery.data ?? [],
        modalEditar,
        abrirModalEditar: () => setModalEditar(true),
        cerrarModalEditar: () => { setModalEditar(false); editarMutation.reset(); },
        editando: editarMutation.isPending,
        errorEdicion: editarMutation.error
            ? mensajeError(editarMutation.error, 'No se pudo guardar el cultivo.')
            : '',
        editarCultivo: (data: ActualizarCultivoPayload, alTerminar?: () => void) =>
            editarMutation.mutate(data, { onSuccess: () => alTerminar?.() }),
    };
}
