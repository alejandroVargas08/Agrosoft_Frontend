import { api } from "../axios";

/** El backend devuelve la entidad Rol tal cual: los campos privados de la
 *  clase salen en el JSON con esos nombres. */
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

// Ojo: el controlador no tiene GET /roles/:id, y la actualización es PUT
export const rolesApi = {
    listar: () => api.get<Rol[]>('/roles'),
    crear: (data: CrearRol) => api.post<Rol>('/roles', data),
    actualizar: (id: number, data: ActualizarRol) => api.put<Rol>(`/roles/${id}`, data),
    eliminar: (id: number) => api.delete(`/roles/${id}`),
};
