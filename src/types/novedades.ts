export type TipoNovedad = 'insumo_bajo' | 'herramienta_danada' | 'problema_cultivo' | 'otro';

/** Misma escala que la severidad de incidencias, para que StatusBadge la conozca. */
export type UrgenciaNovedad = 'low' | 'medium' | 'high';

export type EstadoNovedad = 'pendiente' | 'atendida' | 'descartada';

export interface Novedad {
    id: number;
    tipo: TipoNovedad;
    urgencia: UrgenciaNovedad;
    estado: EstadoNovedad;
    descripcion: string;
    actividadId: number | null;
    insumoId: number | null;
    nombreHerramienta: string | null;
    respuestaInstructor: string | null;
    respondidaEn: string | null;
    creadoEn: string;
    /** Solo viene en la bandeja del instructor. */
    reportadaPor: { id: number; nombre: string; apellido: string } | null;
}

export interface ReportarNovedadPayload {
    tipo: TipoNovedad;
    urgencia: UrgenciaNovedad;
    descripcion: string;
    actividadId?: number;
    insumoId?: number;
    nombreHerramienta?: string;
}
