export type SeveridadIncidencia = 'low' | 'medium' | 'high';
export type EstadoIncidencia = 'open' | 'in_treatment' | 'resolved';

export interface Incidencia {
    id: number;
    titulo: string;
    tipo: string;
    severidad: SeveridadIncidencia;
    estado: EstadoIncidencia;
    cultivoId: number | null;
    fecha: string;          // YYYY-MM-DD
    descripcion: string | null;
}

export interface CrearIncidenciaPayload {
    titulo: string;
    tipo: string;
    severidad: SeveridadIncidencia;
    cultivoId?: number;
    fecha?: string;
    descripcion?: string;
}