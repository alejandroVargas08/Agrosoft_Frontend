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
  // Necesarios para agrupar los sensores por lote, como en el Figma
  loteId: number | null;
  subLoteId: number | null;
  cultivoId: number | null;
}

export interface ResumenSensores {
  enLinea: number;
  desconectados: number;
  total: number;
  alertas: number;
}