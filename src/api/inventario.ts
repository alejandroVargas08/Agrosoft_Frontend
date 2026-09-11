import { api } from './axios';
import type {
    Almacen, CrearAlmacenPayload,
    Categoria, CrearCategoriaPayload,
    Proveedor, CrearProveedorPayload,
    Insumo, CrearInsumoPayload,
    Movimiento, RegistrarMovimientoPayload,
    Reserva, CrearReservaPayload,
} from '../types/inventario';

export const almacenesApi = {
    listar: () => api.get<Almacen[]>('/inventario/almacenes'),
    crear: (data: CrearAlmacenPayload) => api.post<Almacen>('/inventario/almacenes', data),
};

export const categoriasApi = {
    listar: () => api.get<Categoria[]>('/inventario/categorias'),
    crear: (data: CrearCategoriaPayload) => api.post<Categoria>('/inventario/categorias', data),
};

export const proveedoresApi = {
    listar: () => api.get<Proveedor[]>('/inventario/proveedores'),
    crear: (data: CrearProveedorPayload) => api.post<Proveedor>('/inventario/proveedores', data),
};

export const insumosApi = {
    listar: () => api.get<Insumo[]>('/inventario/insumos'),
    listarBajoStock: () => api.get<Insumo[]>('/inventario/insumos/bajo-stock-minimo'),
    crear: (data: CrearInsumoPayload) => api.post<Insumo>('/inventario/insumos', data),
};

export const movimientosApi = {
    registrar: (data: RegistrarMovimientoPayload) =>
    api.post<Movimiento>('/inventario/movimientos', data),
};

export const reservasApi = {
    crear: (data: CrearReservaPayload) => api.post<Reserva>('/inventario/reservas', data),
    confirmar: (id: number) => api.patch<Reserva>(`/inventario/reservas/${id}/confirmar`),
    cancelar: (id: number) => api.patch<Reserva>(`/inventario/reservas/${id}/cancelar`),
};