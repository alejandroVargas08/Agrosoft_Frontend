export interface cambioRegistrado {
    [campo: string]: {anterior: unknown; nuevo: unknown};
}

export interface ActividadHistorial {
    id: number;
    actividadId: number;
    cultivoId: number;
    usuarioId: number;
    motivo: string;
    cambios: cambioRegistrado;
    fechaCreacion: string | Date; 
}

export interface HistorialCultivo {
    id: number;
    cultivoId: number;
    usuarioId: number;
    motivo: string;
    cambios: Record<string, unknown>;
}

export interface HistorialPrecioLote {
    id: number;
    loteProduccionId: number;
    precioAnterior: number;
    precioNuevo: number;
    usuarioId: number; 
    ventaid?: number | null; 
    fecha: string | Date;
    razon?: string | null; 
}

export type tipoFuenteHistorial = 'actividades' | 'cultivos' | 'precio_lotes'; 