import { useMemo } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { cultivosApi } from '../../api/cultivo/cultivos';
import { lotesApi, sublotesApi } from '../../api/territorio';
import { loteProduccionApi } from '../../api/ventas';
import { mensajeError } from '../../api/errores/errores';
import type { Cultivo } from '../../types/cultivos';
import type { LoteProduccion } from '../../types/ventas';

export interface CultivoConCosechas extends Cultivo {
    nombreLote: string;
    nombreSubLote: string | null;
    areaM2: number | null;
    cosechas: LoteProduccion[];
    totalKg: number;
    /** Fecha de la cosecha más reciente, o null si el cultivo aún no ha dado */
    ultimaCosecha: string | null;
}

/**
 * Los cultivos de todos los lotes, con sus cosechas.
 *
 * `GET /cultivos` exige loteId obligatorio, así que no hay forma de pedirlos
 * todos de una: se consulta lote por lote con useQueries, que es el patrón que
 * ya usan Reportes y el detalle de actividad.
 *
 * Las cosechas, en cambio, salen de una sola llamada a `GET /loteProduccion`
 * y se agrupan aquí por cultivo.
 */
export function useCultivosConCosechas(loteFiltroId?: number) {
    const queryClient = useQueryClient();

    const lotesQuery = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        staleTime: 5 * 60_000,
    });

    const lotes = lotesQuery.data ?? [];
    const lotesAConsultar = loteFiltroId ? lotes.filter((l) => l.id === loteFiltroId) : lotes;

    const consultasCultivos = useQueries({
        queries: lotesAConsultar.map((l) => ({
            queryKey: ['cultivos', l.id],
            queryFn: async () => (await cultivosApi.listarPorLote(l.id)).data,
            staleTime: 60_000,
        })),
    });

    const cosechasQuery = useQuery({
        queryKey: ['lotes-produccion'],
        queryFn: async () => (await loteProduccionApi.listar()).data,
        staleTime: 60_000,
    });

    // Los sublotes solo del lote filtrado: pedirlos todos sería una consulta por lote
    const sublotesQuery = useQuery({
        queryKey: ['sublotes', loteFiltroId],
        queryFn: async () => (await sublotesApi.porLote(loteFiltroId!)).data,
        enabled: loteFiltroId !== undefined,
        staleTime: 5 * 60_000,
    });

    const cultivos: CultivoConCosechas[] = useMemo(() => {
        const nombreLote = new Map(lotes.map((l) => [l.id, l.nombre]));
        const areaLote = new Map(lotes.map((l) => [l.id, l.areaM2]));
        const nombreSubLote = new Map((sublotesQuery.data ?? []).map((s) => [s.id, s.nombre]));

        const porCultivo = new Map<number, LoteProduccion[]>();
        for (const c of cosechasQuery.data ?? []) {
            const lista = porCultivo.get(c.cultivoId);
            if (lista) lista.push(c);
            else porCultivo.set(c.cultivoId, [c]);
        }

        return consultasCultivos
            .flatMap((q) => q.data ?? [])
            .map((c) => {
                const cosechas = porCultivo.get(c.id) ?? [];
                return {
                    ...c,
                    nombreLote: nombreLote.get(c.loteId) ?? 'Lote #' + c.loteId,
                    nombreSubLote: c.subLoteId !== null ? nombreSubLote.get(c.subLoteId) ?? null : null,
                    areaM2: areaLote.get(c.loteId) ?? null,
                    cosechas,
                    totalKg: cosechas.reduce((s, h) => s + (h.cantidadKg || 0), 0),
                    ultimaCosecha: cosechas
                        .map((h) => h.fechaCosecha)
                        .filter((f): f is string => !!f)
                        .sort()
                        .pop() ?? null,
                };
            })
            .sort((a, b) => a.nombreCultivo.localeCompare(b.nombreCultivo, 'es'));
    }, [consultasCultivos, cosechasQuery.data, lotes, sublotesQuery.data]);

    // Al finalizar o eliminar hay que refrescar todas las listas por lote
    const invalidar = () => {
        queryClient.invalidateQueries({ queryKey: ['cultivos'] });
    };

    const finalizarMutation = useMutation({
        mutationFn: ({ id, fechaFinalizacion }: { id: number; fechaFinalizacion: string }) =>
            cultivosApi.finalizar(id, fechaFinalizacion),
        onSuccess: invalidar,
    });

    const eliminarMutation = useMutation({
        mutationFn: (id: number) => cultivosApi.eliminar(id),
        onSuccess: invalidar,
    });

    const error = lotesQuery.error ?? cosechasQuery.error ?? consultasCultivos.find((q) => q.error)?.error;

    return {
        cultivos,
        finalizar: (id: number) =>
            finalizarMutation.mutate({ id, fechaFinalizacion: new Date().toISOString().slice(0, 10) }),
        finalizando: finalizarMutation.isPending,
        eliminar: (id: number) => eliminarMutation.mutate(id),
        eliminando: eliminarMutation.isPending,
        cosechas: cosechasQuery.data ?? [],
        lotes,
        cargando: lotesQuery.isLoading || consultasCultivos.some((q) => q.isLoading) || cosechasQuery.isLoading,
        error: error ? mensajeError(error, 'No se pudieron cargar los cultivos.') : '',
    };
}
