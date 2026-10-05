import type { ActividadInsumo, CrearActividadInsumoPayload } from "../../types/actividadDetalle";
import { api } from "../axios";

export const actividadInsumosApi = {
    listar: (actividadId: number) => 
        api.get<ActividadInsumo[]>(`/actividades/${actividadId}/insumos`),

    registrar: (actividadId: number, data: CrearActividadInsumoPayload) =>
        api.post<ActividadInsumo>(`/actividades/${actividadId}/insumos`, data),

    eliminar: (actividadId: number, id: number) =>
        api.delete<void>(`/actividades/${actividadId}/insumo/${id}`),
};