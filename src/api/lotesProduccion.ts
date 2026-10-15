import type { ActualizarLoteProduccionPayload, CrearLoteProduccionPayload, loteProduccion } from "../types/lotesProduccion";
import { api } from "./axios";

export const lotesProduccionApi = {
    listar: (cultivoId?: number) =>
    api.get<loteProduccion[]>('/loteProduccion', {
        params: cultivoId ? { cultivoId } : undefined,
    }),

    crear: (data: CrearLoteProduccionPayload) =>
        api.post<loteProduccion>('/loteProduccion', data),

    actualizar: (id: number, data: ActualizarLoteProduccionPayload ) => 
        api.patch<loteProduccion>(`/loteProduccion/${id}`, data),

    descontarStock: (id: number, cantidadKg: number) =>
        api.patch<loteProduccion>(`/loteProduccion/${id}/stock`, { cantidadKg }),
}; 