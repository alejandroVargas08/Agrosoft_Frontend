import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportesApi } from '../api/reportes';
import type { PeriodoReporte, ReporteGeneral } from '../types/reportes';

const REPORTE_VACIO: ReporteGeneral = {
    periodo: 'mensual',
    resumen: { produccionTotalKg: 0, ingresos: 0, egresos: 0, rentabilidad: 0, unidadesActivas: 0 },
    cultivos: [],
    produccion: [],
    distribucion: [],
    finanzas: [],
};

export function useReportes() {
    const [periodo, setPeriodo] = useState<PeriodoReporte>('mensual');

    const reporteQuery = useQuery({
        queryKey: ['reportes', periodo],
        queryFn: async () => (await reportesApi.obtener(periodo)).data,
    });

    return {
        periodo,
        setPeriodo,
        reporte: reporteQuery.data ?? REPORTE_VACIO,
        cargando: reporteQuery.isLoading,
        error: reporteQuery.error ? 'No se pudo cargar el reporte.' : '',
    };
}