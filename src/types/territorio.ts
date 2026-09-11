export type EstadoLote = 'activo' | 'inactivo' | 'en_preparacion';

export interface Punto {
    lat: number;
    lng: number;
}

// Lo que devuelve el backend al listar/obtener
export interface Lote {
    id: number;
    nombre: string;
    areaM2: number;
    areaHa: number;
    centroide: Punto;
    cantidadVertices: number;
    descripcion?: string;
    estado: EstadoLote;
}

export interface SubLote {
    id: number;
    loteId: number;
    nombre: string;
    areaM2: number;
    areaHa: number;
    centroide: Punto;
    descripcion?: string;
    estado: EstadoLote;
}

// Lo que se envía al crear
export interface CrearLotePayload {
    nombre: string;
    vertices: Punto[]; // mínimo 3
    centroide: Punto;
    areaM2: number;
    descripcion?: string;
    }

export interface CrearSubLotePayload extends CrearLotePayload {
    loteId: number;
}

// Estado del formulario (todo string, como en la guía)
export interface LoteFormState {
    nombre: string;
    descripcion: string;
    areaM2: string;
    centroideLat: string;
    centroideLng: string;
    verticesTexto: string; // una línea por vértice: "lat,lng"
}

export const ESTADO_INICIAL_LOTE_FORM: LoteFormState = {
    nombre: '',
    descripcion: '',
    areaM2: '',
    centroideLat: '',
    centroideLng: '',
    verticesTexto: '',
    };