// Las cuatro medidas del diseño. Lo que no encaje cae en "otro".
export type TipoSensor = "temperatura" | "humedad" | "ph" | "uv" | "luminosidad" | "otro";

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
  // Como se comunica el sensor. El diseño los muestra al pie del detalle.
  protocolo: string | null;
  mqttTopic: string | null;
  endpointUrl: string | null;
}

/** El diseño cuenta estaciones, no sensores sueltos. */
export interface ResumenEstaciones {
  conectadas: number;
  conAlerta: number;
  desconectadas: number;
  uvPromedio: number | null;
}
