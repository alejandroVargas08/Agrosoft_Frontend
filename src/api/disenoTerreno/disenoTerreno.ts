import { api } from '../axios';
import type { AptitudCultivo, DisenoSiembra, EvaluacionTerreno, ResumenEvaluacion, SolicitudEvaluacion } from '../../types/disenoTerreno/disenoTerreno';

export const disenoTerrenoApi = {
    solicitar: (data: SolicitudEvaluacion) => api.post<EvaluacionTerreno>('/diseno-terreno/evaluaciones', data),
    listar: (loteId?: number) =>
        api.get<ResumenEvaluacion[]>('/diseno-terreno/evaluaciones', { params: loteId ? { loteId } : {} }),
    obtener: (id: number) => api.get<EvaluacionTerreno>(`/diseno-terreno/evaluaciones/${id}`),
    disenarCultivo: (id: number, codigo: string) =>
        api.get<{ aptitud: AptitudCultivo; diseno: DisenoSiembra }>(`/diseno-terreno/evaluaciones/${id}/diseno/${codigo}`),
};
