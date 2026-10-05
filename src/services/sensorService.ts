import { apiGet } from "../api/client";
import type { Sensor, TipoSensor } from "../types/sensor";

const UMBRAL_DESCONEXION_MIN = 15; // solo se usa si la API no trae el estado

type Raw = Record<string, any>;

function detectarTipo(t: string): TipoSensor {
  const v = t.toLowerCase();
  if (v.includes("temp")) return "temperatura";
  if (v.includes("hum")) return "humedad";
  if (v.includes("ph")) return "ph";
  return "otro";
}

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v);

/* Adaptador: ajusta SOLO aquí los nombres de campo de tu API */
function normalizar(s: Raw): Sensor {
  const ultimaLectura: string | null =
    s.ultima_lectura ?? s.ultimaLectura ?? s.last_reading_at ?? null;
  const valor = num(s.ultimo_valor ?? s.valor ?? s.value);
  const min = num(s.rango_min ?? s.min);
  const max = num(s.rango_max ?? s.max);

  let enLinea: boolean;
  if (typeof s.en_linea === "boolean") enLinea = s.en_linea;
  else if (typeof s.estado === "string")
    enLinea = ["online", "en_linea", "activo"].includes(s.estado.toLowerCase());
  else
    enLinea =
      !!ultimaLectura &&
      Date.now() - new Date(ultimaLectura).getTime() < UMBRAL_DESCONEXION_MIN * 60_000;

  const fuera = valor !== null && ((min !== null && valor < min) || (max !== null && valor > max));

  return {
    id: s.id,
    nombre: s.nombre ?? s.name ?? "Sensor",
    tipo: detectarTipo(s.tipo ?? s.type ?? ""),
    ubicacion: s.ubicacion ?? s.location ?? "",
    unidad: s.unidad ?? s.unit ?? "",
    valor, min, max, ultimaLectura, enLinea,
    alerta: enLinea && fuera,
  };
}

export async function getSensores(signal?: AbortSignal): Promise<Sensor[]> {
  const json = await apiGet<Raw[] | Raw>("/api/sensores", signal);
  const lista: Raw[] = Array.isArray(json) ? json : json.sensores ?? json.data ?? [];
  return lista.map(normalizar);
}