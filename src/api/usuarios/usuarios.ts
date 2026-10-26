import { api } from "../axios";
import type { SolicitudAcceso } from "./solicitudes";

/** Lo que devuelve el backend como UsuarioPublico. */
export type Usuario = SolicitudAcceso;

export interface CrearUsuario {
    nombre: string;
    apellido: string;
    identificacion: string;
    telefono: string;
    email: string;
    password: string;
    idFicha?: string;
    programaFormacionId?: number;
    rolSolicitado?: string;
}

export interface ActualizarUsuario {
    nombre?: string;
    apellido?: string;
    correo?: string;
    telefono?: string;
    estado?: string;
}

export const usuarioApi = {
    listar: () => api.get<Usuario[]>('/usuarios'),
    obtenerPorId: (id: number) => api.get<Usuario>(`/usuarios/${id}`),
    crear: (data: CrearUsuario) => api.post<Usuario>('/usuarios', data),
    actualizar: (id: number, data: ActualizarUsuario) => api.patch<Usuario>(`/usuarios/${id}`, data),
    eliminar: (id: number) => api.delete(`/usuarios/${id}`),
};
