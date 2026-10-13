import { api } from './axios';
import type { PeriodoReporte, ReporteGeneral } from '../types/reportes';

export const reportesApi = {
    obtener: (periodo: PeriodoReporte) =>
        api.get<ReporteGeneral>('/reportes', { params: { periodo } }),
};