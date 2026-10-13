import { api } from './axios';
import type { Incidencia, CrearIncidenciaPayload, EstadoIncidencia } from '../types/incidencias';

export const incidenciasApi = {
    listar: () => api.get<Incidencia[]>('/incidencias'),
    crear: (data: CrearIncidenciaPayload) => api.post<Incidencia>('/incidencias', data),
    cambiarEstado: (id: number, estado: EstadoIncidencia) =>
        api.patch<Incidencia>(`/incidencias/${id}/estado`, { estado }),
    eliminar: (id: number) => api.delete(`/incidencias/${id}`),
};