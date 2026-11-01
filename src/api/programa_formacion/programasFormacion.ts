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

/** Quien aparece como instructor de una ficha. */
export interface PersonaFicha {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
}

/** Lo que devuelve GET /programas-formacion/resumen. */
export interface ProgramaConResumen extends ProgramaFormacion {
    instructores: PersonaFicha[];
    totalAprendices: number;
}

export interface CrearPrograma {
    nombre: string;
    tipo: string;
    ficha: string;
    fechaInicio: string;
    fechaFin: string;
    estado?: string;
}

export type ActualizarPrograma = Partial<CrearPrograma>;

export const programasFormacionApi = {
    // Sin permisos: lo usa el registro, que es publico
    listarActivos: () => api.get<ProgramaFormacion[]>('/programas-formacion'),
    // Las fichas a cargo del usuario en sesion
    listarAsignables: () => api.get<ProgramaFormacion[]>('/mi-acceso/programas'),
    // Estos tres exigen usuarios.gestionar
    listarTodos: () => api.get<ProgramaFormacion[]>('/programas-formacion/todos'),
    resumen: () => api.get<ProgramaConResumen[]>('/programas-formacion/resumen'),
    crear: (data: CrearPrograma) => api.post<ProgramaFormacion>('/programas-formacion', data),
    actualizar: (id: number, data: ActualizarPrograma) =>
        api.patch<ProgramaFormacion>(`/programas-formacion/${id}`, data),
};

/** Las fichas a cargo de un instructor. El backend devuelve solo los ids. */
export const fichasACargoApi = {
    listar: (usuarioId: number) => api.get<number[]>(`/usuarios/${usuarioId}/programas`),
    asignar: (usuarioId: number, programaFormacionId: number) =>
        api.post<number[]>(`/usuarios/${usuarioId}/programas`, { programaFormacionId }),
    quitar: (usuarioId: number, programaFormacionId: number) =>
        api.delete<number[]>(`/usuarios/${usuarioId}/programas/${programaFormacionId}`),
};

export function etiquetaPrograma(programa: ProgramaFormacion): string {
    return `${programa.nombre} — Ficha ${programa.ficha}`;
}
