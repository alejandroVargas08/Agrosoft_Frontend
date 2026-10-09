export type TipoFiltro = 'Todos' | 'actividad' | 'cultivo' | 'precio_lote';

export interface CambioCampo {
    anterior: unknown;
    nuevo: unknown;
}

export interface HistorialItem {
    id: number;
    tipo: 'actividad' | 'cultivo' | 'precio_lote';
    usuarioId: number;
    usuarioNombre?: string;
    fecha: string| Date;
    accion: string; 
    motivo?: string;
    cambios?: Record<string, CambioCampo>;
    precioAnterior?: number;
    precioNuevo?: number;
}