import { api } from "../axios";

export interface Rol {
    id: number;
    nombre: string;
    descripcion: string;
    esSistema: boolean;
    estado: string;
}

export interface CrearRol {
    nombre: string;
    descripcion?: string;
    esSistema?: boolean;
}

export type ActualizarRol = Partial<Omit<CrearRol, 'esSistema'>>;

export const rolesApi = {
    listar: () => api.get<Rol[]>('/roles'),
    obtenerPorId: (id: number) => api.get<Rol>(`/roles/${id}`),
    crear: (data: CrearRol) => api.post<Rol>('/roles', data),
    actualizar: (id: number, data: ActualizarRol) => api.patch<Rol>(`/roles/${id}`, data),
    eliminar: (id: number) => api.delete(`/roles/${id}`),
};
