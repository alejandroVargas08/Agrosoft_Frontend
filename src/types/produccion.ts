export type EstadoCultivo = 'activo' | 'finalizado' | 'cancelado';

// Una unidad productiva (en el backend se llama "cultivo")
export interface UnidadProductiva {
    id: number;
    nombreCultivo: string;
    tipoCultivo: string;
    loteId: number;
    subLoteId?: number | null;
    fechaSiembra: string;               // ISO
    fechaFinalizacion?: string | null;  // ISO
    costoTotal: number;
    estado: EstadoCultivo;
}

export interface CrearUnidadProductivaPayload {
    nombreCultivo: string;
    tipoCultivo: string;
    loteId: number;
    subLoteId?: number;
    fechaSiembra: string; // ISO, ej. "2026-09-24"
}