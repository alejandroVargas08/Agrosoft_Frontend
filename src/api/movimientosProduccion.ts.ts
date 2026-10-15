import { api } from './axios';
import type {
    MovimientoProduccion,
    RegistrarMovimientoProduccionPayload, } from '../types/movimientosProduccion';


export const movimientosProduccionApi = {
    listar: (loteProduccionId: number) =>
    api.get<MovimientoProduccion[]>(`/loteProduccion/${loteProduccionId}/movimientos`),

    registrar: (loteProduccionId: number, data: RegistrarMovimientoProduccionPayload) =>
    api.post<MovimientoProduccion>(`/loteProduccion/${loteProduccionId}/movimientos`, data),
};