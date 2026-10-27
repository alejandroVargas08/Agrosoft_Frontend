export type EstadoUsuario = 'activo' | 'inactivo' | 'pendiente' | 'rechazado' | 'suspendido';

export interface SolicitudRegistro {
    rolSolicitado: 'Instructor' | 'Administrador';
    cargo: string | null;
    motivo: string | null;
    fichasACargo: number[];
    solicitadoEn: string;
    resueltoEn: string | null;
    motivoRechazo: string | null;
}

export interface UsuarioAdmin {
    id: number;
    nombre: string;
    apellido: string;
    identificacion: string;
    correo: string;
    telefono: string;
    rolId: number;
    programaFormacionId: number | null;
    idFicha: string | null;
    estado: EstadoUsuario;
    solicitud: SolicitudRegistro | null;
    ultimoIngreso: string | null;
    creadoEn: string;
}

export interface Rol {
    id: number;
    nombre: string;
    descripcion: string;
    esSistema: boolean;
    estado: string;
}

export interface Permiso {
    id: number;
    nombre: string;
    descripcion: string;
    estado: string;
}

export interface RolPermiso {
    id: number;
    rolId: number;
    permisoId: number;
}

export interface PersonaFicha {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
}

export interface FichaResumen {
    id: number;
    nombre: string;
    tipo: string;
    ficha: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    instructores: PersonaFicha[];
    totalAprendices: number;
}

export interface DatosFicha {
    nombre: string;
    tipo: string;
    ficha: string;
    fechaInicio: string;
    fechaFin: string;
    estado?: string;
}

export interface NuevoUsuario {
    nombre: string;
    apellido: string;
    identificacion: string;
    telefono: string;
    email: string;
    password: string;
    idFicha?: string;
}

export interface ResultadoContrasena {
    usuarioId: number;
    contrasenaTemporal: string | null;
}

export interface ConfigIot {
    id: number;
    nombre: string;
    agente: string;
    puerto: number;
    protocolo: string;
    nombreUsuario: string;
    prefijoTema: string;
    temasPredeterminados: string | null;
    temasPersonalizados: string | null;
    loteId: number | null;
    subLoteId: number | null;
    activo: boolean;
    autoDiscover: boolean;
}

export interface NuevaConfigIot {
    nombre: string;
    agente: string;
    puerto: number;
    protocolo: string;
    nombreUsuario: string;
    contrasena: string;
    prefijoTema: string;
    loteId?: number;
    subLoteId?: number;
}

export const ROL_ADMIN = 'Administrador';
export const ROL_INSTRUCTOR = 'Instructor';
export const ROL_APRENDIZ = 'Aprendiz';
export const PERMISO_ADMIN = 'usuarios.gestionar';
