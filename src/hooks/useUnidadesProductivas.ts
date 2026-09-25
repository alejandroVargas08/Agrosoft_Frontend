import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { unidadesProductivasApi } from '../api/produccion';
import { useTerritorio } from './useTerritorio';
import type { EstadoCultivo, UnidadProductiva } from '../types/produccion';

export function useUnidadesProductivas() {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'Todos' | EstadoCultivo>('Todos');

    // Los lotes y sublotes sirven para mostrar la ubicación y el área de cada unidad
    const { lotes, sublotes, loading: cargandoTerritorio, error: errorTerritorio } = useTerritorio();

    // El backend lista cultivos por lote, así que se consulta lote por lote
    const consultas = useQueries({
        queries: lotes.map((lote) => ({
            queryKey: ['unidades-productivas', lote.id],
            queryFn: async () => (await unidadesProductivasApi.listarPorLote(lote.id)).data,
        })),
    });

    const unidades: UnidadProductiva[] = consultas.flatMap((c) => c.data ?? []);
    const cargando = cargandoTerritorio || consultas.some((c) => c.isLoading);
    const error = errorTerritorio ?? (consultas.some((c) => c.error) ? 'No se pudieron cargar las unidades productivas' : null);

    // Ubicación: el sublote si lo tiene, si no el lote
    const ubicacionDe = (u: UnidadProductiva) => {
        const sublote = u.subLoteId ? sublotes.find((s) => s.id === u.subLoteId) : undefined;
        if (sublote) return { nombre: sublote.nombre, areaM2: sublote.areaM2 };
        const lote = lotes.find((l) => l.id === u.loteId);
        return { nombre: lote?.nombre ?? `Lote #${u.loteId}`, areaM2: lote?.areaM2 };
    };

    const unidadesVisibles = unidades
        .filter((u) => filtroEstado === 'Todos' || u.estado === filtroEstado)
        .filter((u) => {
            const texto = busqueda.trim().toLowerCase();
            return (
                u.nombreCultivo.toLowerCase().includes(texto) ||
                u.tipoCultivo.toLowerCase().includes(texto)
            );
        });

    return {
        unidades: unidadesVisibles,
        totalUnidades: unidades.length,
        lotes,
        cargando,
        error,
        busqueda, setBusqueda,
        filtroEstado, setFiltroEstado,
        ubicacionDe,
    };
}