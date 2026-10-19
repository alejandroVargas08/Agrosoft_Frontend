import { api } from '../axios';

export interface ProgramaFormacion {
    id: number;
    nombre: string;
    tipo: string;
    ficha: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
}

export const programasFormacionApi = {
    listarActivos: () => api.get<ProgramaFormacion[]>('/programas-formacion'),
    listarAsignables: () => api.get<ProgramaFormacion[]>('/mi-acceso/programas'),
};

export function etiquetaPrograma(programa: ProgramaFormacion): string {
    return `${programa.nombre} — Ficha ${programa.ficha}`;
}
