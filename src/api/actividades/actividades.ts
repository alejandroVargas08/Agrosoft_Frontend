import type { Actividad, CrearActividadPayLoad } from "../../types/actividades";
import type { Cultivo } from "../../types/cultivos";
import { api } from "../axios";

export const actividadesApi = {
    listarPorCultivo: (cultivoId: number) => api.get<Actividad[]>(`/actividades/cultivo/${cultivoId}`),
    obtenerPorId: (id: number) => api.get<Actividad>(`/actividades/${id}`),
    crear: (data: CrearActividadPayLoad) => api.post<Actividad>('/actividades', data),
    cambiarEstado: (id: number, estado: string) =>
        api.patch<Actividad>(`/actividades/${id}/estado`, { estado }),
};

export const lotesApi = {
    listar: () => api.get('/territorio/lotes'),
    sublotesPorLote: (loteId: number) => api.get(`/territorio/sublotes/por-lote/${loteId}`),
};

export const cultivosApi = {
    listarPorLote: (loteId: number) => api.get<Cultivo[]>(`/cultivos?loteId=${loteId}`),
};

/** Un producto agrícola vendible. unidadBase suele ser 'kg'. */
export interface ProductoAgro {
    id: number;
    nombre: string;
    unidadBase: string;
    descripcion?: string | null;
    imagen?: string | null;
}

export const productosAgroApi = {
    listar: () => api.get<ProductoAgro[]>('/productos-agro'),
};
