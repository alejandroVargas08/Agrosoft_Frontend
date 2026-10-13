import { api } from './axios';
import type { Tratamiento, CrearTratamientoPayload, EstadoTratamiento } from '../types/tratamientos';

export const tratamientosApi = {
    listar: (incidenciaId?: number) =>
        api.get<Tratamiento[]>('/tratamientos', {
            params: incidenciaId ? { incidenciaId } : undefined,
        }),
    crear: (data: CrearTratamientoPayload) => api.post<Tratamiento>('/tratamientos', data),
    cambiarEstado: (id: number, estado: EstadoTratamiento) =>
        api.patch<Tratamiento>(`/tratamientos/${id}/estado`, { estado }),
    eliminar: (id: number) => api.delete(`/tratamientos/${id}`),
};