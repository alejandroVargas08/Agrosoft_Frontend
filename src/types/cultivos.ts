export type EstadoCultivo = 'activo' | 'finalizado' | 'cancelado';

export interface Cultivo {
    id: number;
    nombreCultivo: string;
    tipoCultivo: string;
    loteId: number;
    subLoteId: number | null;
    fechaSiembra: string; // Iso date
    fechaFinalizacion?: string | null;
    constoTotal: number; 
    estado: EstadoCultivo;
}

export interface CrearCultivoPayload {
    nombreCultivo: string; 
    tipoCultivo: string;
    loteId: number;
    subLoteId?: number | undefined;
    fechaSiembra: string;
}

export interface CultivoFormState {
    nombreCultivo: string;
    tipoCultivo: string;
    subLoteId: string;
    fechaSiembra: string;
}

export const ESTADO_INICIAL_CULTIVO_FORM: CultivoFormState = {
    nombreCultivo: '',
    tipoCultivo: '',
    subLoteId: '',
    fechaSiembra: '',
};

export interface ActualizarCultivoPayload {
    nombreCultivo?: string;
    tipoCultivo?: string;
}