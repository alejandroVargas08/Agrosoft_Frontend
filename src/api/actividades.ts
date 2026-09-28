import type { Actividad, CrearActividadPayLoad } from "../types/actividades";
import { api } from "./axios";


export const actividadesApi = {

    listarPorCultivo: (cultivoId: number) => api.get<Actividad[]>(`/actividades/cultivo/${cultivoId}`),

    crear: (data: CrearActividadPayLoad) => api.post<Actividad>('/actividades', data), 

    cambiarEstado: (
        id: number,
        estado: string
    ) => api.patch<Actividad> (`/actividades/${id}/estado`, {estado}),
};

export const lotesApi = {
    listar: () => api.get('/territorio/lotes'),
    sublotesPorLote: (loteId: number) => api.get(`/territorio/sublotes/por-lote/${loteId}`),
};

export const cultivosApi = {
    listarPorLote: (loteId: number) => api.get(`/cultivos?loteId=${loteId}`),
};

export const productosAgroApi = {
    listar: () => api.get('/productos-agro'),
};