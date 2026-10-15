export interface loteProduccion {
    id: number;
    productoAgroId: number;
    cultivoId: number;
    loteId: number;
    subLoteId?: number | null;
    actividadesCosechaId?: number | null;
    calidad: string;
    cantidadKg: number;
    stockDisponibleKg: number;
    costoUnitarioKg: number;
    costoTotal: number; 
    precioSugeridoKg: number;
}

export interface CrearLoteProduccionPayload {
    productoAgroId: number;
    cultivoId: number;
    loteId: number;
    subLoteId?: number;
    actividadesCosechaId?: number;
    calidad: string;
    cantidadKg: number;
    stockDisponibleKg: number;
    costoUnitarioKg: number;
    costoTotal: number;
    precioSugeridoKg: number;
}

export type ActualizarLoteProduccionPayload = Partial<CrearLoteProduccionPayload>;

export interface LoteProduccionFormState {
    productoAgroId: string;
    loteId: string;
    cultivoId: string;
    subLoteId: string;
    actividadesCosechaId: string;
    calidad: string;
    cantidadKg: string;
    stockDisponibleKg: string;
    costoUnitarioKg: string;
    precioSugeridoKg: string;
}

export const ESTADO_INICIAL_LOTE_PRODUCCION_FORM: LoteProduccionFormState = {
    productoAgroId: '',
    loteId: '',
    cultivoId: '',
    subLoteId: '',
    actividadesCosechaId: '',
    calidad: '',
    cantidadKg: '',
    stockDisponibleKg: '',
    costoUnitarioKg: '',
    precioSugeridoKg: '',
};
