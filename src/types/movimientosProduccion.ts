export type TipoMovimientoProduccion = 'entrada' | 'salida';

export interface MovimientoProduccion {
    id: number;
    loteProduccionId: number;
    tipo: TipoMovimientoProduccion;
    cantidadKg: number;
    costoUnitarioKg: number;
    precioUnitarioKg: number;
    costoTotal: number; 
    ventaId: number | null;
    descripcion: string | null;
    usuarioId: number;
    fecha: string; 
}

export interface RegistrarMovimientoProduccionPayload {
    tipo: TipoMovimientoProduccion;
    cantidadKg: number; // > 0
    costoUnitarioKg: number; // >= 0
    precioUnitarioKg: number; // >= 0
    ventaId?: number;
    descripcion?: string;
    usuarioId: number;
}

export interface MovimientoProduccionFormState {
    tipo: TipoMovimientoProduccion;
    cantidadKg: string;
    costoUnitarioKg: string;
    precioUnitarioKg: string;
    ventaId: string;
    descripcion: string;
}