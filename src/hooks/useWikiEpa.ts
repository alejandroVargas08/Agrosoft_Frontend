import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wikiEpaApi } from '../api/wikiEpa';
import { mensajeError } from '../api/errores/errores';
import type { TipoEpa } from '../types/wikiEpa';

export const FILTROS = ['Todos', 'Enfermedades', 'Plagas', 'Arvenses'] as const;
export type Filtro = (typeof FILTROS)[number];

// Cada filtro de la barra apunta a un tipo del backend
const TIPO_POR_FILTRO: Record<Exclude<Filtro, 'Todos'>, TipoEpa> = {
    Enfermedades: 'ENFERMEDAD',
    Plagas: 'PLAGA',
    Arvenses: 'ARVENSE',
};

export function useWikiEpa() {
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState<Filtro>('Todos');

    const { data, isLoading, error } = useQuery({
        queryKey: ['epas'],
        queryFn: async () => (await wikiEpaApi.listar()).data,
    });

    const entradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return (data ?? []).filter((epa) => {
            const coincideTipo = filtro === 'Todos' || epa.tipoEpa === TIPO_POR_FILTRO[filtro];
            if (!coincideTipo) return false;
            if (!texto) return true;
            return (
                epa.nombre.toLowerCase().includes(texto) ||
                epa.descripcion.toLowerCase().includes(texto) ||
                epa.sintomas.toLowerCase().includes(texto) ||
                epa.etiquetas.some((etiqueta) => etiqueta.toLowerCase().includes(texto))
            );
        });
    }, [data, busqueda, filtro]);

    return {
        entradas,
        total: data?.length ?? 0,
        busqueda,
        setBusqueda,
        filtro,
        setFiltro,
        cargando: isLoading,
        error: error ? mensajeError(error, 'No se pudo cargar la wiki.') : '',
    };
}
