import type { ActividadServicio, CrearActividadServicioPayload } from "../../types/actividadDetalle";
import { api } from "../axios";

export const actividadServiciosApi = {
    listar: (actividadId: number) =>
        api.get<ActividadServicio[]>(`/actividades/${actividadId}/servicios`),

    registrar: (actividadId: number, data: CrearActividadServicioPayload) =>
        api.post<ActividadServicio>(`/actividades/${actividadId}/servicio`, data),

    actualizarHoras: (actividadId: number, id:number, horas: number) =>
        api.patch<ActividadServicio>(`/actividades/${actividadId}/servicios/${id}`, { horas}),

    eliminar: (actividadId: number, id: number) =>
        api.delete<void>(`/actividades/${actividadId}/servicios/${id}`),
};
