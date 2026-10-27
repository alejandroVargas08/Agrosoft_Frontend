import { api } from './axios';
import type {
    Venta, CrearVentaPayload,
    Cliente, CrearClientePayload,
    VentaDetalle, CrearVentaDetallePayload,
    LoteProduccion,
} from '../types/ventas';

export const ventasApi = {
    listar: () => api.get<Venta[]>('/ventas'),
    crear: (data: CrearVentaPayload) => api.post<Venta>('/ventas', data),
    marcarPagada: (id: number) => api.patch<Venta>(`/ventas/${id}/pagar`),
    anular: (id: number, usuarioId: number) =>
        api.patch<Venta>(`/ventas/${id}/anular`, { usuarioId }),
};

export const clientesApi = {
    listar: () => api.get<Cliente[]>('/clientes'),
    crear: (data: CrearClientePayload) => api.post<Cliente>('/clientes', data),
};

export const ventasDetallesApi = {
    listar: () => api.get<VentaDetalle[]>('/ventas-detalles'),
    crear: (data: CrearVentaDetallePayload) =>
        api.post<VentaDetalle>('/ventas-detalles', data),
};

export interface CrearLoteProduccionPayload {
    productoAgroId: number;
    cultivoId: number;
    loteId: number;
    subLoteId?: number;
    calidad: string;
    cantidadKg: number;
    stockDisponibleKg: number;
    costoUnitarioKg: number;
    costoTotal: number;
    precioSugeridoKg: number;
}

export const loteProduccionApi = {
    listar: () => api.get<LoteProduccion[]>('/loteProduccion'),
    /** Las cosechas de un cultivo. El backend filtra por cultivoId. */
    listarPorCultivo: (cultivoId: number) =>
        api.get<LoteProduccion[]>('/loteProduccion', { params: { cultivoId } }),
    crear: (data: CrearLoteProduccionPayload) =>
        api.post<LoteProduccion>('/loteProduccion', data),
    descontarStock: (id: number, cantidadKg: number) =>
        api.patch(`/loteProduccion/${id}/stock`, { cantidadKg }),
};