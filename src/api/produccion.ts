import { api } from './axios';
import type { UnidadProductiva, CrearUnidadProductivaPayload, HistorialCultivo } from '../types/produccion';

// En el backend las unidades productivas son "cultivos"
export const unidadesProductivasApi = {
    listarPorLote: (loteId: number) =>
        api.get<UnidadProductiva[]>('/cultivos', { params: { loteId } }),
    obtener: (id: number) => api.get<UnidadProductiva>(`/cultivos/${id}`),
    crear: (data: CrearUnidadProductivaPayload) => api.post<UnidadProductiva>('/cultivos', data),
    finalizar: (id: number, fechaFinalizacion: string) =>
        api.patch<UnidadProductiva>(`/cultivos/${id}/finalizar`, { fechaFinalizacion }),
    eliminar: (id: number) => api.delete(`/cultivos/${id}`),
    historial: (id: number) => api.get<HistorialCultivo[]>(`/cultivos/${id}/historial`),
};