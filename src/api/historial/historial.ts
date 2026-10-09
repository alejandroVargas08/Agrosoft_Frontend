import { 
        type ActividadHistorial, 
        type HistorialCultivo, 
        type HistorialPrecioLote } from "../../types/historial";
import { api } from "../axios";

export const actividadHistorialApi = {
    listarPorActividad: (actividadId: number) =>
        api.get<ActividadHistorial[]>(`/actividadHistorial/actividad/${actividadId}`),
};

export const historialCultivoApi = {
    listarPorCultivo: (cultivoId: number) =>
        api.get<HistorialCultivo[]>(`/cultivos/${cultivoId}/historial`),
};

export const historialPreciosLoteApi = {
    listar: () => api.get<HistorialPrecioLote[]>('/historial-precios-lote'),
    listarPorLote: (loteId: number) => 
        api.get<HistorialPrecioLote[]>(`/historial-precios-lote/lote/${loteId}`),
    eliminar: (id: number) => api.delete(`/historial-precios-lote/${id}`),
};