import type { ActividadInsumoReserva, CrearActividadInsumoReservaPayload } from "../../types/actividadDetalle";
import { api } from "../axios";


export const actividadInsumoReservaApi = {
    listar: (actividadId: number) =>
        api.get<ActividadInsumoReserva[]>(`/actividad/${actividadId}/insumoReserva`),

    reservar: (actividadId: number, data: CrearActividadInsumoReservaPayload) =>
        api.post<ActividadInsumoReserva>(`/actividad/${actividadId}/insumoReserva`, data),

    ajustarCantidad: (actividadId: number, id: number, cantidadReserva: number) =>
        api.patch<ActividadInsumoReserva>(`/actividad/${actividadId}/insumoReserva/${id}`, {
            cantidadReserva,
        }),
    
    liberar: (actividadId: number, id: number) =>
        api.delete<void>(`/actividad/${actividadId}/insumoReserva/${id}`),
};

