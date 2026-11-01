import { api } from '../axios';

/** Un permiso concedido directamente a un usuario, por encima de los de su rol. */
export interface UsuarioPermiso {
    id: number;
    usuarioId: number;
    permisoId: number;
}

export const usuariosPermisosApi = {
    porUsuario: (usuarioId: number) => api.get<UsuarioPermiso[]>(`/usuario-permisos/${usuarioId}`),
    asignar: (usuarioId: number, permisoId: number) =>
        api.post<UsuarioPermiso>('/usuario-permisos', { usuarioId, permisoId }),
    quitar: (usuarioId: number, permisoId: number) =>
        api.delete(`/usuario-permisos/${usuarioId}/${permisoId}`),
};
