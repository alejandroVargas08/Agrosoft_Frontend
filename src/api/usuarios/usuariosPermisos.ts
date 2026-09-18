import { api } from '../axios';

export const usuariosPermisosApi = {
  porUsuario: (usuarioId: number) => api.get(`/usuarios-permisos/por-usuario/${usuarioId}`),
  asignar: (usuarioId: number, permisoId: number) =>
    api.post('/usuarios-permisos', { usuarioId, permisoId }),
  quitar: (usuarioId: number, permisoId: number) =>
    api.delete(`/usuarios-permisos/${usuarioId}/${permisoId}`),
};