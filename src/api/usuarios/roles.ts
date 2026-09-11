import { api } from "../axios";

export const rolesApi ={
    listar: () => api.get('/roles'),
    obtenerPorId: (id: number) => api.get(`/roles/${id}`),
    crear: (data: any) => api.post('/roles', data),
    actualizar: (id: number, data: any) => api.patch(`/roles/${id}`, data),
    eliminar: (id: number) => api.delete(`/roles/${id}`),
};