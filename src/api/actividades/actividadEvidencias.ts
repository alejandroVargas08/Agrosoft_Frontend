import type { ActividadEvidencia, CrearActividadEvidenciaPayload } from "../../types/actividadDetalle";
import { api } from "../axios";


export const ActividadEvidenciaApi = {
    listar: (actividadId: number) =>
        api.get<ActividadEvidencia[]>(`/actividades/${actividadId}/evidencias`),

    registrar: (actividadId: number, data: CrearActividadEvidenciaPayload) =>
        api.post<ActividadEvidencia>(`/actividades/${actividadId}/evidencias`, data),

    agregarImagen: (actividadId: number, id: number, url: string) =>
        api.patch<ActividadEvidencia>(`/actividades/${actividadId}/evidencias/${id}/imagenes`, {
            url,
        }),

    eliminar: (actividadId: number, id: number) =>
        api.delete<void>(`/actividades/${actividadId}/evidencias/${id}`),
};
