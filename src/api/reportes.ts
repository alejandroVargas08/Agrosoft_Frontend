import { api } from './axios';
import type { ClimaDelDia, PeriodoReporte, ReporteClima, ReporteGeneral } from '../types/reportes';

export const reportesApi = {
    obtener: (periodo: PeriodoReporte) =>
        api.get<ReporteGeneral>('/reportes', { params: { periodo } }),
    clima: (periodo: PeriodoReporte) =>
        api.get<ReporteClima>('/reportes/clima', { params: { periodo } }),
    /** Promedio de las estaciones de un lote en un día (AAAA-MM-DD) */
    climaDelDia: (loteId: number, fecha: string) =>
        api.get<ClimaDelDia>('/reportes/clima/dia', { params: { loteId, fecha } }),
};