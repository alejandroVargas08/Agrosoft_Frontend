import { api } from './axios';
import type { SensorAlerta, Sensor, InsumoBajoStock, ActividadPendiente } from '../types/alertas';

export const alertasApi = {
    sensorAlertas: () => api.get<SensorAlerta[]>('/sensor-alertas'),
    sensores: () => api.get<Sensor[]>('/sensores'),
    insumosBajoStock: () => api.get<InsumoBajoStock[]>('/inventario/insumos/bajo-stock-minimo'),
    actividades: () => api.get<ActividadPendiente[]>('/actividades'),
    descartarSensorAlerta: (id: number) => api.delete(`/sensor-alertas/${id}`),
};