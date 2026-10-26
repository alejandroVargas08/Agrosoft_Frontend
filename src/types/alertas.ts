export type SeveridadAlerta = 'high' | 'medium' | 'low';
export type TipoAlerta = 'sensor' | 'stock' | 'task';

// Lo que devuelve el backend
export interface SensorAlerta {
    id: number;
    sensorId: number;
    valor: number;
    umbral: number;
    tipo: string;
    fechaAlerta: string;
    loteId: number | null;
    subLoteId: number | null;
}

export interface Sensor {
    id: number;
    nombreSensor: string;
    unidad?: string;
    estadoConexion?: string;
}

export interface InsumoBajoStock {
    id: number;
    nombre: string;
    unidadUso: string;
    stockDisponible: number;
    stockMinimo: number;
}

export interface ActividadPendiente {
    id: number;
    nombre: string;
    tipo: string;
    estado: string;
    fecha: string;
    loteId: number;
    cultivoId: number;
}

// Lo que consume la pantalla, ya normalizado
export interface Alerta {
    id: string;
    tipo: TipoAlerta;
    titulo: string;
    descripcion: string;
    fecha: string;
    severidad: SeveridadAlerta;
    idOriginal: number;
}