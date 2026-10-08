import { api } from "../axios";
import type { Cultivo, CrearCultivoPayload, ActualizarCultivoPayload } from "../../types/cultivos";


export const cultivosApi = {
    listarPorLote: (loteId: number) =>
        api.get<Cultivo[]>('/cultivos', { params: {loteId}}),

    obtenerPorId: (id: number) => api.get<Cultivo>(`/cultivos/${id}`),
    crear: (data: CrearCultivoPayload) => api.post<Cultivo>('/cultivos', data),
    actualizar: (id:number, data: ActualizarCultivoPayload) =>
        api.patch<Cultivo>(`/cultivos/${id}`, data),
    finalizar: (id: number, fechaFinalizacion: string) =>
        api.patch<Cultivo>(`/cultivos/${id}/finalizar`, {fechaFinalizacion}),
    eliminar: (id: number) => api.delete<void>(`/cultivos/${id}`),
};