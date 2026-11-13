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
    /** Área propia de la unidad; si es null se usa la del lote o sublote */
    areaM2?: number | null;
}

export interface CrearUnidadProductivaPayload {
    nombreCultivo: string;
    tipoCultivo: string;
    loteId: number;
    subLoteId?: number;
    fechaSiembra: string; // ISO, ej. "2026-09-24"
    areaM2?: number;
}

/** Lo que se puede cambiar de una unidad. El lote no: sus cosechas apuntan a él. */
export interface ActualizarUnidadProductivaPayload {
    nombreCultivo?: string;
    tipoCultivo?: string;
    fechaSiembra?: string;
    areaM2?: number;
    /** Queda en el historial de la unidad */
    motivo?: string;
}

// Historial de cambios de una unidad productiva
export interface HistorialCultivo {
    id: number;
    cultivoId: number;
    usuarioId: number;
    motivo: string;
    /** Cada campo cambiado con su valor de antes y el de después */
    cambios: Record<string, { antes: unknown; despues: unknown } | unknown>;
    fecha: string | null;
    usuarioNombre: string | null;
}