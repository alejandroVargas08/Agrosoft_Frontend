export type EstadoLote = 'activo' | 'inactivo' | 'en_preparacion';

export interface Punto {
    lat: number;
    lng: number;
}

export interface Lote {
    id: number;
    nombre: string;
    areaM2: number;
    areaHa: number;
    centroide: Punto;
    vertices: Punto[];
    cantidadVertices: number;
    descripcion?: string;
    estado: EstadoLote;
    programaFormacionId?: number | null;
}

export interface SubLote {
    id: number;
    loteId: number;
    nombre: string;
    areaM2: number;
    areaHa: number;
    centroide: Punto;
    vertices: Punto[];
    descripcion?: string;
    estado: EstadoLote;
}

export interface CrearLotePayload {
    nombre: string;
    vertices: Punto[];
    centroide: Punto;
    areaM2: number;
    descripcion?: string;
}

export interface CrearLotePrincipalPayload extends CrearLotePayload {
    programaFormacionId: number | null;
}

export interface CrearSubLotePayload extends CrearLotePayload {
    loteId: number;
}

export interface LoteFormState {
    nombre: string;
    descripcion: string;
    areaM2: string;
    centroideLat: string;
    centroideLng: string;
    verticesTexto: string;
}

export const ESTADO_INICIAL_LOTE_FORM: LoteFormState = {
    nombre: '',
    descripcion: '',
    areaM2: '',
    centroideLat: '',
    centroideLng: '',
    verticesTexto: '',
};
