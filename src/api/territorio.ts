import { api } from './axios';
import type {
    Lote,
    SubLote,
    CrearLotePayload,
    CrearSubLotePayload,
    EstadoLote,
} from '../types/territorio';

export const lotesApi = {
    listar: () => api.get<Lote[]>('/territorio/lotes'),
    obtener: (id: number) => api.get<Lote>(`/territorio/lotes/${id}`),
    crear: (data: CrearLotePayload) => api.post<Lote>('/territorio/lotes', data),
    cambiarEstado: (id: number, nuevoEstado: EstadoLote) =>
        api.patch<Lote>(`/territorio/lotes/${id}/estado`, { nuevoEstado }),
    eliminar: (id: number) => api.delete(`/territorio/lotes/${id}`),
};

export const sublotesApi = {
    porLote: (loteId: number) =>
        api.get<SubLote[]>(`/territorio/sublotes/por-lote/${loteId}`),
    crear: (data: CrearSubLotePayload) =>
        api.post<SubLote>('/territorio/sublotes', data),
    cambiarEstado: (id: number, nuevoEstado: EstadoLote) =>
        api.patch<SubLote>(`/territorio/sublotes/${id}/estado`, { nuevoEstado }),
    eliminar: (id: number) => api.delete(`/territorio/sublotes/${id}`),
};