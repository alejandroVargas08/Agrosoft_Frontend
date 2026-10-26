import { api } from './axios';
import type { Epa } from '../types/wikiEpa';

export const wikiEpaApi = {
    listar: () => api.get<Epa[]>('/epas'),
    obtener: (id: number) => api.get<Epa>(`/epas/${id}`),
};
