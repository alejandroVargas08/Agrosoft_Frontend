import { api } from "../axios";

/** Lo que pidió el usuario al registrarse, si pidió un rol que requiere aprobación. */
export interface SolicitudRegistro {
    rolSolicitado: 'Instructor' | 'Administrador';
    cargo: string | null;
    motivo: string | null;
    fichasACargo: number[];
    solicitadoEn: string;
    resueltoEn: string | null;
    motivoRechazo: string | null;
}

/** Espejo de UsuarioPublico en el backend. Ojo: el campo es `correo`, no `email`. */
export interface Usuario {
    id: number;
    nombre: string;
    apellido: string;
    identificacion: string;
    correo: string;
    telefono: string;
    rolId: number;
    programaFormacionId: number | null;
    idFicha: string | null;
    estado: string;
    solicitud: SolicitudRegistro | null;
    ultimoIngreso: string | null;
    creadoEn: string;
}

export type TipoUsuarioRegistro = 'aprendiz' | 'instructor' | 'administrador';

/** El registro: `email` y `password` aquí sí, porque así los recibe el DTO. */
export interface CrearUsuario {
    nombre: string;
    apellido: string;
    identificacion: string;
    telefono: string;
    email: string;
    password: string;
    idFicha?: string;
    programaFormacionId?: number;
    tipoUsuario?: TipoUsuarioRegistro;
    codigoInstructor?: string;
    fichasACargo?: string[];
    cargo?: string;
    motivoSolicitud?: string;
}

export interface UsuarioRegistrado extends Usuario {
    requiereAprobacion: boolean;
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
    crear: (data: CrearUsuario) => api.post<UsuarioRegistrado>('/usuarios', data),
    actualizar: (id: number, data: ActualizarUsuario) => api.patch<Usuario>(`/usuarios/${id}`, data),
    eliminar: (id: number) => api.delete(`/usuarios/${id}`),
};
