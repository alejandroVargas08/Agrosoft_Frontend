import type { ActualizarProductoAgroPayload, CrearProductoAgroPayload, ProductoAgro } from "../../types/productosAgro";
import { api } from "../axios";

export const productosAgroApi = {
    listar: () => api.get<ProductoAgro[]>('/productos-agro'),
    obtenerPorId: (id: number) => api.get<ProductoAgro>(`/productos-agro/${id}`),
    crear: (data: CrearProductoAgroPayload) => api.post<ProductoAgro>('/productos-agro', data),
    actualizar: (id: number, data: ActualizarProductoAgroPayload) => api.patch<ProductoAgro>(`/productos-agro/${id}`, data),
    eliminar: (id: number) => api.delete<void>(`/productos-agro/${id}`),
}