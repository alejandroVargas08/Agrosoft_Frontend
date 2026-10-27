import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cultivosApi } from '../../api/cultivo/cultivos';
import { actividadesApi, productosAgroApi } from '../../api/actividades/actividades';
import { loteProduccionApi, type CrearLoteProduccionPayload } from '../../api/ventas';
import { lotesApi } from '../../api/territorio';
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
    const [modalAbierto, setModalAbierto] = useState(false);
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

    const productosQuery = useQuery({
        queryKey: ['productos-agro'],
        queryFn: async () => (await productosAgroApi.listar()).data,
        enabled: modalAbierto,
        staleTime: 1000 * 60 * 5,
    });

    const cultivo = cultivoQuery.data ?? null;
    const cosechas = cosechasQuery.data ?? [];
    const lote = (lotesQuery.data ?? []).find((l) => l.id === cultivo?.loteId) ?? null;

    const totalKg = cosechas.reduce((s, c) => s + (c.cantidadKg || 0), 0);
    const ingresoEstimado = cosechas.reduce((s, c) => s + (c.cantidadKg || 0) * (c.precioSugeridoKg || 0), 0);
    const costoTotal = cultivo?.costoTotal || 0;
    const areaHa = lote?.areaHa && lote.areaHa > 0 ? lote.areaHa : null;

    const metricas: MetricasCultivo = {
        totalKg,
        cosechas: cosechas.length,
        stockDisponibleKg: cosechas.reduce((s, c) => s + (c.stockDisponibleKg || 0), 0),
        // El backend no guarda fecha de cosecha aparte: la más reciente es la de mayor id
        ultimaCosecha: cosechas.length > 0 ? String(Math.max(...cosechas.map((c) => c.id))) : null,
        rendimientoKgHa: areaHa ? Math.round(totalKg / areaHa) : null,
        ingresoEstimado,
        precioReferencialKg: totalKg > 0 ? Math.round(ingresoEstimado / totalKg) : null,
        costoTotal,
        retornoPorcentaje: costoTotal > 0 ? Math.round(((ingresoEstimado - costoTotal) / costoTotal) * 100) : null,
    };

    const registrarMutation = useMutation({
        mutationFn: (data: CrearLoteProduccionPayload) => loteProduccionApi.crear(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cosechas-cultivo', cultivoId] });
            queryClient.invalidateQueries({ queryKey: ['lotes-produccion'] });
        },
    });

    const error = cultivoQuery.error || cosechasQuery.error;

    return {
        cultivo,
        lote,
        cosechas,
        actividades: actividadesQuery.data ?? [],
        productos: productosQuery.data ?? [],
        metricas,
        cargando: cultivoQuery.isLoading,
        error: error ? mensajeError(error, 'No se pudo cargar el cultivo.') : '',
        modalAbierto,
        abrirModal: () => setModalAbierto(true),
        cerrarModal: () => { setModalAbierto(false); registrarMutation.reset(); },
        registrando: registrarMutation.isPending,
        errorRegistro: registrarMutation.error
            ? mensajeError(registrarMutation.error, 'No se pudo registrar la cosecha.')
            : '',
        registrarCosecha: (data: CrearLoteProduccionPayload, alTerminar?: () => void) =>
            registrarMutation.mutate(data, { onSuccess: () => alTerminar?.() }),
    };
}
