import { api } from '../axios';

export const usuariosPermisosApi = {
  porUsuario: (usuarioId: number) => api.get(`/usuario-permisos/${usuarioId}`),
  asignar: (usuarioId: number, permisoId: number) =>
    api.post('/usuario-permisos', { usuarioId, permisoId }),
  quitar: (usuarioId: number, permisoId: number) =>
    api.delete(`/usuario-permisos/${usuarioId}/${permisoId}`),
};
