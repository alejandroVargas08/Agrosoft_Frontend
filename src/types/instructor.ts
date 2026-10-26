// Tipos del perfil instructor: fichas a cargo, aprendices y asignaciones de
// actividades. Espejo de lo que devuelve el backend.

// Una ficha ES un programa de formación: mismo dato, dos nombres según quién
// lo mire. Se reusa el tipo en lugar de declararlo dos veces.
export type { ProgramaFormacion as Ficha } from '../api/programa_formacion/programasFormacion';

export interface Aprendiz {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    programaFormacionId: number | null;
}

export type EstadoAsignacion =
    | 'ASIGNADA'
    | 'EN_PROGRESO'
    | 'ENTREGADA'
    | 'APROBADA'
    | 'DEVUELTA';

export interface PersonaResumen {
    id: number;
    nombre: string;
    apellido: string;
}

export interface ActividadResumen {
    id: number;
    nombre: string;
    tipo: string;
    subtipo: string | null;
    descripcion: string;
    fecha: string;
    loteId: number;
    subLoteId: number | null;
    cultivoId: number;
    estado: string;
}

export interface Asignacion {
    id: number;
    estado: EstadoAsignacion;
    vencida: boolean;
    fechaLimite: string | null;
    horasTrabajadas: number | null;
    comentarioAprendiz: string | null;
    comentarioInstructor: string | null;
    iniciadaEn: string | null;
    entregadaEn: string | null;
    revisadaEn: string | null;
    creadoEn: string | null;
    aprendiz: PersonaResumen | null;
    asignadoPor: PersonaResumen | null;
    actividad: ActividadResumen | null;
}

export interface AsignarActividadPayload {
    aprendizIds: number[];
    fechaLimite?: string;
}

export interface EntregarTareaPayload {
    horasTrabajadas: number;
    comentario?: string;
}

/** Lo que devuelve GET /aprendices/resumen. Trae documento y teléfono porque
 *  un instructor no puede leer GET /usuarios/:id de otra persona. */
export interface ResumenAprendiz {
    id: number;
    nombre: string;
    apellido: string;
    identificacion: string;
    correo: string;
    telefono: string;
    idFicha: string | null;
    programaFormacionId: number | null;
    tareas: number;
    aprobadas: number;
    /** Entregadas y esperando revisión. */
    entregadas: number;
    /** Con el plazo encima y todavía sin entregar. */
    vencidas: number;
    horas: number;
    ultimoIngreso: string | null;
}
