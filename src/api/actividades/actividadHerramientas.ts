import type { ActividadHerramienta, CrearActividadHerramientaPayload } from "../../types/actividadDetalle";
import { api } from "../axios";

export const actividadHerramientasApi = {
    listar: (actividadId: number) =>
        api.get<ActividadHerramienta[]>(`/actividad/${actividadId}/herramientas`),

    asignar: (actividadId: number, data: CrearActividadHerramientaPayload) =>
        api.post<ActividadHerramienta>(`/actividad/${actividadId}/herramientas`, data),

    reestimar: (actividadId: number, id: number, horasEstimadas: number) =>
        api.patch<ActividadHerramienta>(`/actividad/${actividadId}/herramientas/${id}`, {
            horasEstimadas, }),

    quitar: (actividadId: number, id: number) =>
        api.delete<void>(`/actividad/${actividadId}/herramientas/${id}`),
};