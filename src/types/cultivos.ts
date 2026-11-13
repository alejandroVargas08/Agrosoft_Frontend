export type EstadoCultivo = 'activo' | 'finalizado' | 'cancelado';

export interface Cultivo {
    id: number;
    nombreCultivo: string;
    tipoCultivo: string;
    loteId: number;
    subLoteId: number | null;
    fechaSiembra: string; // Iso date
    fechaFinalizacion?: string | null;
    costoTotal: number; 
    estado: EstadoCultivo;
    /** Área propia del cultivo; si es null se usa la del lote */
    areaM2?: number | null;
    /** Lo que se planeó invertir. costoTotal es lo gastado de verdad. */
    costoEstimado?: number | null;
}

export interface CrearCultivoPayload {
    nombreCultivo: string; 
    tipoCultivo: string;
    loteId: number;
    subLoteId?: number | undefined;
    fechaSiembra: string;
    fechaFinalizacion?: string;
    costoEstimado?: number;
}

export interface CultivoFormState {
    nombreCultivo: string;
    tipoCultivo: string;
    loteId: string;
    subLoteId: string;
    fechaSiembra: string;
    fechaFinalizacion: string;
    costoEstimado: string;
}

export const ESTADO_INICIAL_CULTIVO_FORM: CultivoFormState = {
    nombreCultivo: '',
    tipoCultivo: '',
    loteId: '',
    subLoteId: '',
    fechaSiembra: '',
    fechaFinalizacion: '',
    costoEstimado: '',
};

export interface ActualizarCultivoPayload {
    nombreCultivo?: string;
    tipoCultivo?: string;
    fechaSiembra?: string;
    subLoteId?: number;
    fechaFinalizacion?: string;
    costoEstimado?: number;
}