import { api } from '../axios';
import type { Usuario } from './usuarios';

export type { SolicitudRegistro } from './usuarios';

/** Una solicitud de acceso es un usuario en estado 'pendiente'. */
export type SolicitudAcceso = Usuario;

export interface RolBasico {
    id: number;
    nombre: string;
}

export const solicitudesApi = {
    listar: () => api.get<SolicitudAcceso[]>('/usuarios/solicitudes'),
    aprobar: (id: number) => api.patch<SolicitudAcceso>(`/usuarios/${id}/aprobar`),
    // El motivo es obligatorio: el backend lo guarda y se lo muestra a la
    // persona cuando intenta entrar.
    rechazar: (id: number, motivo: string) =>
        api.patch<SolicitudAcceso>(`/usuarios/${id}/rechazar`, { motivo }),
    roles: () => api.get<RolBasico[]>('/roles'),
};
