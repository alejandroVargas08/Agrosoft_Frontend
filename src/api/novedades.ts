import { api } from './axios';
import type { Novedad, ReportarNovedadPayload } from '../types/novedades';

/** Lo que el aprendiz reporta y consulta de lo suyo. */
export const misNovedadesApi = {
    listar: (estado?: string) =>
        api.get<Novedad[]>('/mis-novedades', { params: estado ? { estado } : undefined }),
    reportar: (data: ReportarNovedadPayload) => api.post<Novedad>('/mis-novedades', data),
};

/** La bandeja del instructor. La respuesta es obligatoria en los dos casos:
 *  el aprendiz tiene que saber en qué quedó lo que reportó. */
export const novedadesApi = {
    listar: (estado?: string) =>
        api.get<Novedad[]>('/novedades', { params: estado ? { estado } : undefined }),
    atender: (id: number, respuesta: string) =>
        api.patch<Novedad>(`/novedades/${id}/atender`, { respuesta }),
    descartar: (id: number, respuesta: string) =>
        api.patch<Novedad>(`/novedades/${id}/descartar`, { respuesta }),
};
