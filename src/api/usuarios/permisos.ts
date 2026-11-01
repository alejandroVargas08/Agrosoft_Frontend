import { api } from "../axios";

export interface Permiso {
    id: number;
    nombre: string;
    descripcion: string;
    estado: string;
}

export interface CrearPermiso {
    nombre: string;
    descripcion?: string;
}

export type ActualizarPermiso = Partial<CrearPermiso>;

// Ojo: el controlador no tiene GET /permisos/:id, y la actualización es PUT
export const permisosApi = {
    listar: () => api.get<Permiso[]>('/permisos'),
    crear: (data: CrearPermiso) => api.post<Permiso>('/permisos', data),
    actualizar: (id: number, data: ActualizarPermiso) => api.put<Permiso>(`/permisos/${id}`, data),
    eliminar: (id: number) => api.delete(`/permisos/${id}`),
};
