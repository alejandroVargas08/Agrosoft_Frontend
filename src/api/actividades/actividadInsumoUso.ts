import type { ActividadInsumoUso, CrearActividadInsumoUsoPayload } from "../../types/actividadDetalle";
import { api } from "../axios";

export const actividadInsumoUsoApi = {
    listar: (actividadId: number) =>
        api.get<ActividadInsumoUso[]>(`/actividad(${actividadId}/insumoUso)`),

    registrar: (actividadId: number, data: CrearActividadInsumoUsoPayload) =>
        api.post<ActividadInsumoUso>(`/actividad/${actividadId}/insumoUso`, data),
};