import { api } from '../axios';

/** Un usuario esperando aprobación. El backend lo devuelve como UsuarioPublico. */
export interface SolicitudAcceso {
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
}

export interface RolBasico {
    id: number;
    nombre: string;
}

export const solicitudesApi = {
    listar: () => api.get<SolicitudAcceso[]>('/usuarios/pendientes'),
    aprobar: (id: number) => api.patch<SolicitudAcceso>(`/usuarios/${id}/aprobar`),
    rechazar: (id: number) => api.patch<SolicitudAcceso>(`/usuarios/${id}/rechazar`),
    roles: () => api.get<RolBasico[]>('/roles'),
};
