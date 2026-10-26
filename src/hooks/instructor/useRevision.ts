import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { aprendicesApi, misFichasApi, revisionApi } from '../../api/instructor';
import { lotesApi } from '../../api/territorio';
import { cultivosApi } from '../../api/cultivo/cultivos';
import { mensajeError } from '../../api/errores/errores';
import type { Asignacion } from '../../types/instructor';

/** Una entrega lista para mostrar: ya con el nombre de la ficha, del lote y
 *  del cultivo resueltos, en lugar de los ids que devuelve el backend. */
export interface EntregaPorRevisar {
    asignacion: Asignacion;
    aprendiz: string;
    ficha: string;
    fichaId: number | null;
    actividad: string;
    lote: string;
    cultivo: string;
    entregadaTarde: boolean;
}

export function useRevision() {
    const queryClient = useQueryClient();
    const [ficha, setFicha] = useState('');
    const [soloVencidas, setSoloVencidas] = useState(false);

    const porRevisarQuery = useQuery({
        queryKey: ['asignaciones-por-revisar'],
        queryFn: async () => (await revisionApi.porRevisar()).data,
    });

    // Catálogos para traducir ids a nombres. Se cachean: casi no cambian.
    const aprendicesQuery = useQuery({
        queryKey: ['aprendices'],
        queryFn: async () => (await aprendicesApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });
    const fichasQuery = useQuery({
        queryKey: ['mis-fichas'],
        queryFn: async () => (await misFichasApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });
    const lotesQuery = useQuery({
        queryKey: ['lotes'],
        queryFn: async () => (await lotesApi.listar()).data,
        staleTime: 1000 * 60 * 5,
    });
    // GET /cultivos exige loteId, no se puede listar todo. Se piden solo los
    // lotes que aparecen en las entregas, que son pocos.
    const lotesEnEntregas = useMemo(() => {
        const ids = new Set<number>();
        for (const a of porRevisarQuery.data ?? []) {
            if (a.actividad) ids.add(a.actividad.loteId);
        }
        return [...ids];
    }, [porRevisarQuery.data]);

    const cultivosPorLote = useQueries({
        queries: lotesEnEntregas.map((loteId) => ({
            queryKey: ['cultivos', loteId],
            queryFn: async () => (await cultivosApi.listarPorLote(loteId)).data,
            staleTime: 1000 * 60 * 5,
        })),
    });
    const cultivos = cultivosPorLote.flatMap((c) => c.data ?? []);

    const entregas: EntregaPorRevisar[] = (() => {
        const aprendices = aprendicesQuery.data ?? [];
        const fichas = fichasQuery.data ?? [];
        const lotes = lotesQuery.data ?? [];

        const fichaDeAprendiz = new Map(aprendices.map((a) => [a.id, a.programaFormacionId]));
        const nombreFicha = new Map(fichas.map((f) => [f.id, f.ficha]));
        const nombreLote = new Map(lotes.map((l) => [l.id, l.nombre]));
        const nombreCultivo = new Map(cultivos.map((c) => [c.id, c.nombreCultivo]));

        return (porRevisarQuery.data ?? []).map((asignacion) => {
            const persona = asignacion.aprendiz;
            const fichaId = persona ? fichaDeAprendiz.get(persona.id) ?? null : null;
            const actividad = asignacion.actividad;

            // "Tarde" es haber entregado después del plazo, distinto de "vencida",
            // que es tener el plazo encima sin haber entregado.
            const entregadaTarde =
                !!asignacion.entregadaEn &&
                !!asignacion.fechaLimite &&
                new Date(asignacion.entregadaEn) > new Date(asignacion.fechaLimite);

            return {
                asignacion,
                aprendiz: persona ? persona.nombre + ' ' + persona.apellido : 'Aprendiz #' + asignacion.id,
                ficha: fichaId !== null ? nombreFicha.get(fichaId) ?? String(fichaId) : 'Sin ficha',
                fichaId,
                actividad: actividad
                    ? actividad.subtipo
                        ? actividad.tipo + ' — ' + actividad.subtipo
                        : actividad.tipo
                    : 'Actividad',
                lote: actividad ? nombreLote.get(actividad.loteId) ?? 'Lote #' + actividad.loteId : '—',
                cultivo: actividad
                    ? nombreCultivo.get(actividad.cultivoId) ?? 'Cultivo #' + actividad.cultivoId
                    : '—',
                entregadaTarde,
            };
        });
    })();

    const filtradas = entregas.filter(
        (e) =>
            (!ficha || e.ficha === ficha) && (!soloVencidas || e.asignacion.vencida),
    );

    const fichasDisponibles = [...new Set(entregas.map((e) => e.ficha))].sort();

    const refrescar = () => {
        queryClient.invalidateQueries({ queryKey: ['asignaciones-por-revisar'] });
        queryClient.invalidateQueries({ queryKey: ['mis-fichas'] });
    };

    const aprobarMutation = useMutation({
        mutationFn: ({ id, comentario }: { id: number; comentario?: string }) =>
            revisionApi.aprobar(id, comentario),
        onSuccess: refrescar,
    });

    const devolverMutation = useMutation({
        mutationFn: ({ id, comentario }: { id: number; comentario: string }) =>
            revisionApi.devolver(id, comentario),
        onSuccess: refrescar,
    });

    const errorAccion = aprobarMutation.error || devolverMutation.error;

    return {
        entregas: filtradas,
        total: entregas.length,
        fichasDisponibles,
        ficha,
        setFicha,
        soloVencidas,
        setSoloVencidas,
        cargando: porRevisarQuery.isLoading,
        error: porRevisarQuery.error
            ? mensajeError(porRevisarQuery.error, 'No se pudieron cargar las entregas.')
            : '',
        errorAccion: errorAccion ? mensajeError(errorAccion, 'No se pudo completar la acción.') : '',
        procesando: aprobarMutation.isPending || devolverMutation.isPending,
        aprobar: (id: number, comentario: string, alTerminar?: () => void) =>
            aprobarMutation.mutate(
                { id, comentario: comentario.trim() || undefined },
                { onSuccess: () => alTerminar?.() },
            ),
        devolver: (id: number, comentario: string, alTerminar?: () => void) =>
            devolverMutation.mutate({ id, comentario: comentario.trim() }, { onSuccess: () => alTerminar?.() }),
    };
}
