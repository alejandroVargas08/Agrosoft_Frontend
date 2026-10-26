import { apiGet } from "../api/client";
import type { Sensor, TipoSensor } from "../types/sensor";

const UMBRAL_DESCONEXION_MIN = 15;

type Raw = Record<string, unknown>;

function detectarTipo(t: string): TipoSensor {
  const v = t.toLowerCase();
  if (v.includes("temp")) return "temperatura";
  if (v.includes("hum")) return "humedad";
  if (v.includes("ph")) return "ph";
  return "otro";
}

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v);

// Raw entrega todo como unknown: estos dos lo convierten sin silenciar el tipo
const texto = (v: unknown): string | null =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : null;

const primerTexto = (...valores: unknown[]): string | null => {
  for (const v of valores) {
    const t = texto(v);
    if (t !== null && t !== "") return t;
  }
  return null;
};

function normalizar(s: Raw): Sensor {
  const ultimaLectura = primerTexto(s.ultima_lectura, s.ultimaLectura, s.last_reading_at);
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
    id: num(s.id) ?? primerTexto(s.id) ?? 0,
    nombre: primerTexto(s.nombre, s.name) ?? "Sensor",
    tipo: detectarTipo(primerTexto(s.tipo, s.type) ?? ""),
    ubicacion: primerTexto(s.ubicacion, s.location) ?? "",
    unidad: primerTexto(s.unidad, s.unit) ?? "",
    valor, min, max, ultimaLectura, enLinea,
    alerta: enLinea && fuera,
  };
}

export async function getSensores(signal?: AbortSignal): Promise<Sensor[]> {
  const json = await apiGet<Raw[] | Raw>("/sensores", signal);
  // La respuesta puede venir como arreglo suelto o envuelta en sensores/data
  const comoArreglo = (v: unknown): Raw[] | null => (Array.isArray(v) ? (v as Raw[]) : null);
  const lista: Raw[] =
    comoArreglo(json) ?? comoArreglo((json as Raw).sensores) ?? comoArreglo((json as Raw).data) ?? [];
  return lista.map(normalizar);
}
