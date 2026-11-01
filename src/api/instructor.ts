import { api } from './axios';
import type {
    Aprendiz,
    ResumenAprendiz,
    AsignarActividadPayload,
    Asignacion,
    EntregarTareaPayload,
    Ficha,
} from '../types/instructor';

/** Las fichas a cargo del usuario que está en sesión.
 *  Sale del alcance de datos: para un instructor son sus fichas, para un
 *  administrador son todas. */
export const misFichasApi = {
    listar: () => api.get<Ficha[]>('/mi-acceso/programas'),
};

export const resumenAprendicesApi = {
    // Sin programaFormacionId devuelve todos los que el alcance permite
    listar: (programaFormacionId?: number) =>
        api.get<ResumenAprendiz[]>('/aprendices/resumen', {
            params: programaFormacionId ? { programaFormacionId } : undefined,
        }),
    tareas: (aprendizId: number) => api.get<Asignacion[]>(`/aprendices/${aprendizId}/tareas`),
};

export const aprendicesApi = {
    // Sin programaFormacionId devuelve todos los que el alcance permite
    listar: (programaFormacionId?: number) =>
        api.get<Aprendiz[]>('/usuarios/aprendices', {
            params: programaFormacionId ? { programaFormacionId } : undefined,
        }),
};

/** Lo que el instructor tiene que revisar, y su decisión. */
export const revisionApi = {
    porRevisar: () => api.get<Asignacion[]>('/asignaciones/por-revisar'),
    aprobar: (id: number, comentario?: string) =>
        api.patch<Asignacion>(`/asignaciones/${id}/aprobar`, { comentario }),
    // El comentario es obligatorio al devolver: el aprendiz tiene que saber qué corregir
    devolver: (id: number, comentario: string) =>
        api.patch<Asignacion>(`/asignaciones/${id}/devolver`, { comentario }),
};

/** Las tareas del aprendiz que está en sesión. */
export const misTareasApi = {
    listar: (estados?: string) =>
        api.get<Asignacion[]>('/mis-tareas', { params: estados ? { estado: estados } : undefined }),
    obtener: (id: number) => api.get<Asignacion>(`/mis-tareas/${id}`),
    iniciar: (id: number) => api.patch<Asignacion>(`/mis-tareas/${id}/iniciar`),
    entregar: (id: number, data: EntregarTareaPayload) =>
        api.patch<Asignacion>(`/mis-tareas/${id}/entregar`, data),
};

/** Asignar una actividad a varios aprendices. */
export const asignacionesApi = {
    listarPorActividad: (actividadId: number) =>
        api.get<Asignacion[]>(`/actividades/${actividadId}/asignaciones`),
    asignar: (actividadId: number, data: AsignarActividadPayload) =>
        api.post<Asignacion[]>(`/actividades/${actividadId}/asignaciones`, data),
    quitar: (actividadId: number, id: number) =>
        api.delete(`/actividades/${actividadId}/asignaciones/${id}`),
};
