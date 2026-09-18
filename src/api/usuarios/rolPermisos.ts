import { api } from '../axios';

export const rolPermisosApi = {
  porRol: (rolId: number) => api.get(`/rol-permisos/por-rol/${rolId}`),
  asignar: (rolId: number, permisoId: number) =>
    api.post('/rol-permisos', { rolId, permisoId }),
  quitar: (rolId: number, permisoId: number) =>
    api.delete(`/rol-permisos/${rolId}/${permisoId}`),
};