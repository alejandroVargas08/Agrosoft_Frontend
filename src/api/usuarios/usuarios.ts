import { api } from "../axios";

export const usuarioApi ={
    listar: () => api.get('/usuarios'),
    obtenerPorIp: (id: number) => api.get (`/usuarios/${id}`),
    crear: (data:any) => api.post('/usuarios', data),
    actualizar: (id: number, data: any) => api.patch(`/usuario/${id}`, data),
    cambiarEstado: (id: number, activo: boolean)=> api.patch(`/usuarios/${id}/estado`, {activo}),
    eliminar: (id: number) => api.delete(`/usuarios/${id}`),
};