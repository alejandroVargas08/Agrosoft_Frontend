import { api } from "../axios";
import type { Analisis, Banda, Captura, Dron, DronPayload, ResultadoCaptura, ResultadoCarga, SolicitudAnalisis, Vuelo, VueloPayload } from "../../types/drones/drones";

export const dronesApi = {
    listar: () => api.get<Dron[]>('/drones'),
    crear: (data: DronPayload) => api.post<Dron>('/drones', data),
    actualizar: (id: number, data: Partial<DronPayload> & { activo?: boolean }) => api.patch<Dron>(`/drones/${id}`, data),
    eliminar: (id: number) => api.delete(`/drones/${id}`),
};

export const vuelosApi = {
    listar: (filtros: { loteId?: number; dronId?: number } = {}) => api.get<Vuelo[]>('/vuelos', { params: filtros }),
    obtener: (id: number) => api.get<Vuelo>(`/vuelos/${id}`),
    crear: (data: VueloPayload) => api.post<Vuelo>('/vuelos', data),
    eliminar: (id: number) => api.delete(`/vuelos/${id}`),
    capturas: (id: number) => api.get<Captura[]>(`/vuelos/${id}/capturas`),
    subirArchivos: (id: number, archivos: File[], alProgresar: (cargados: number, total: number) => void) => {
        const datos = new FormData();
        archivos.forEach((archivo) => datos.append('archivos', archivo));
        return api.post<ResultadoCarga>(`/vuelos/${id}/archivos`, datos, {
            timeout: 0,
            onUploadProgress: (evento) => alProgresar(evento.loaded, evento.total ?? evento.loaded),
        });
    },
    analisis: (id: number) => api.get<Analisis[]>(`/vuelos/${id}/analisis`),
    solicitarAnalisis: (id: number, data: SolicitudAnalisis) => api.post<Analisis>(`/vuelos/${id}/analisis`, data),
    imagen: (vueloId: number, capturaId: number, banda: Banda, tamano: 'miniatura' | 'completa') =>
        api.get<Blob>(`/vuelos/${vueloId}/capturas/${capturaId}/imagen`, {
            params: { banda, tamano },
            responseType: 'blob',
            timeout: 60000,
        }),
    capa: (vueloId: number, capturaId: number, indice: string) =>
        api.get<Blob>(`/vuelos/${vueloId}/capturas/${capturaId}/capa`, {
            params: { indice },
            responseType: 'blob',
            timeout: 120000,
        }),
};

export const analisisApi = {
    obtener: (id: number) => api.get<Analisis>(`/analisis-vuelo/${id}`),
    resultados: (id: number, soloCriticas = false) =>
        api.get<ResultadoCaptura[]>(`/analisis-vuelo/${id}/resultados`, { params: { soloCriticas } }),
};
