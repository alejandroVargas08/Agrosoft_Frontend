export type TipoSensor = "temperatura" | "humedad" | "ph" | "otro";

export interface Sensor {
  id: string | number;
  nombre: string;
  tipo: TipoSensor;
  ubicacion: string;
  unidad: string;
  valor: number | null;
  min: number | null;
  max: number | null;
  ultimaLectura: string | null;
  enLinea: boolean;
  alerta: boolean;
}

export interface ResumenSensores {
  enLinea: number;
  desconectados: number;
  total: number;
  alertas: number;
}