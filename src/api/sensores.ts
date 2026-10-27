import { api } from './axios';

export interface SensorLectura {
    id: number;
    sensorId: number;
    valor: string;
    fechaLectura: string;
    unidad: string;
    observaciones: string | null;
}

export const sensorLecturasApi = {
    porSensor: (sensorId: number) =>
        api.get<SensorLectura[]>(`/sensor-lecturas/sensor/${sensorId}`),
};

export interface ActualizarRangoPayload {
    valorMinimoSensor: number;
    valorMaximoSensor: number;
}

export const sensoresApi = {
    actualizarRango: (id: number, data: ActualizarRangoPayload) =>
        api.patch(`/sensores/${id}`, data),
};
