import { api } from './axios';
import type { SensorAlerta, Sensor, InsumoBajoStock, ActividadPendiente } from '../types/alertas';

export const alertasApi = {
    sensorAlertas: () => api.get<SensorAlerta[]>('/sensor-alertas'),
    sensores: () => api.get<Sensor[]>('/sensores'),
    insumosBajoStock: () => api.get<InsumoBajoStock[]>('/inventario/insumos/bajo-stock-minimo'),
    actividades: () => api.get<ActividadPendiente[]>('/actividades'),
    // Cierra la alerta sin borrarla: queda en el historial como descartada
    descartarSensorAlerta: (id: number) => api.patch(`/sensor-alertas/${id}/descartar`),
};