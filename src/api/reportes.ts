import { api } from './axios';
import type { PeriodoReporte, ReporteClima, ReporteGeneral } from '../types/reportes';

export const reportesApi = {
    obtener: (periodo: PeriodoReporte) =>
        api.get<ReporteGeneral>('/reportes', { params: { periodo } }),
    clima: (periodo: PeriodoReporte) =>
        api.get<ReporteClima>('/reportes/clima', { params: { periodo } }),
};