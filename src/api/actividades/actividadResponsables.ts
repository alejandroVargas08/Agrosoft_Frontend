import type { ActividadResponsable, CrearActividadResponsablePayload } from "../../types/actividadDetalle";
import { api } from "../axios";

export const actividadResponsablesApi = {
    listar: (actividadId: number) =>
        api.get<ActividadResponsable[]>(`/actividades/${actividadId}/responsables`),

    registrar: (actividadId: number, data: CrearActividadResponsablePayload) =>
        api.post<ActividadResponsable>(`/actividades/${actividadId}/responsables`, data),

    actualizarHoras: (actividadId: number, id: number, horas: number) =>
        api.patch<ActividadResponsable>(`/actividades/${actividadId}/responsables/${id}`, { horas }),

    eliminar: (actividadId: number, id: number) =>
        api.delete<void>(`/actividades/${actividadId}/responsables/${id}`),
};
