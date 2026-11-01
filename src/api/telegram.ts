import { api } from './axios';

export interface EstadoVinculacionTelegram {
    vinculado: boolean;
}

export interface CodigoVinculacionTelegram {
    codigo: string;
    expiraEn: string;
}

export const telegramApi = {
    estado: () => api.get<EstadoVinculacionTelegram>('/telegram/vinculacion'),
    generarCodigo: () => api.post<CodigoVinculacionTelegram>('/telegram/vinculacion/codigo'),
    desvincular: () => api.delete('/telegram/vinculacion'),
};
