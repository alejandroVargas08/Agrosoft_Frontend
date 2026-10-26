import { api } from "../axios";

export interface Permiso {
    id: number;
    nombre: string;
    descripcion: string;
}

export interface CrearPermiso {
    nombre: string;
    descripcion?: string;
}

export type ActualizarPermiso = Partial<CrearPermiso>;

export const permisosApi = {
    listar: () => api.get<Permiso[]>('/permisos'),
    obtenerPorId: (id: number) => api.get<Permiso>(`/permisos/${id}`),
    crear: (data: CrearPermiso) => api.post<Permiso>('/permisos', data),
    actualizar: (id: number, data: ActualizarPermiso) => api.patch<Permiso>(`/permisos/${id}`, data),
    eliminar: (id: number) => api.delete(`/permisos/${id}`),
};
