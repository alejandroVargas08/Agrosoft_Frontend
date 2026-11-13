import type { ActividadEvidencia, CrearActividadEvidenciaPayload } from "../../types/actividadDetalle";
import { api } from "../axios";


export const ActividadEvidenciaApi = {
    /** Con asignacionId trae solo las de esa entrega; sin el, todas. */
    listar: (actividadId: number, asignacionId?: number) =>
        api.get<ActividadEvidencia[]>(`/actividades/${actividadId}/evidencias`, {
            params: asignacionId === undefined ? undefined : { asignacionId },
        }),

    registrar: (actividadId: number, data: CrearActividadEvidenciaPayload) =>
        api.post<ActividadEvidencia>(`/actividades/${actividadId}/evidencias`, data),

    agregarImagen: (actividadId: number, id: number, url: string) =>
        api.patch<ActividadEvidencia>(`/actividades/${actividadId}/evidencias/${id}/imagenes`, {
            url,
        }),

    eliminar: (actividadId: number, id: number) =>
        api.delete<void>(`/actividades/${actividadId}/evidencias/${id}`),
};
