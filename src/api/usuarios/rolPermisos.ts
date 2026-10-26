import { api } from '../axios';

/** La fila puente entre un rol y un permiso. */
export interface RolPermiso {
    id: number;
    rolId: number;
    permisoId: number;
}

export const rolPermisosApi = {
    porRol: (rolId: number) => api.get<RolPermiso[]>(`/rol-permisos/${rolId}`),
    asignar: (rolId: number, permisoId: number) =>
        api.post<RolPermiso>('/rol-permisos', { rolId, permisoId }),
    quitar: (rolId: number, permisoId: number) =>
        api.delete(`/rol-permisos/${rolId}/${permisoId}`),
};
