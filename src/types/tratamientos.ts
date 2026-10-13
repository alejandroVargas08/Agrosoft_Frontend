export type EstadoTratamiento = 'scheduled' | 'applied';

export interface Tratamiento {
    id: number;
    incidenciaId: number | null;
    producto: string;
    dosis: string | null;
    fecha: string;
    costo: number;
    notas: string | null;
    estado: EstadoTratamiento;
}

export interface CrearTratamientoPayload {
    incidenciaId?: number | null;
    producto: string;
    dosis?: string | null;
    fecha?: string;
    costo?: number;
    notas?: string | null;
}