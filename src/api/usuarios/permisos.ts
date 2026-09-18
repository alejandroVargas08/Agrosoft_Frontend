import { api } from "../axios";

export const permisosApi={
    listar: () => api.get('/permisos',),
    obtenerPorId: (id:number) => api.get(`/permisos/${id}`),
    crear: (data: any) => api.post('/permisos', data),
    actualizar: (id: number, data: any) => api.patch(`/permisos/${id}`, data),
    eliminar: (id: number) => api.delete(`/permisos/${id}`),
};