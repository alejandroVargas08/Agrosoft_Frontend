import { apiGet } from "../api/client";
import type { Sensor, TipoSensor } from "../types/sensor";

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

const texto = (v: unknown): string | null =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : null;

const primerTexto = (...valores: unknown[]): string | null => {
  for (const v of valores) {
    const t = texto(v);
    if (t !== null && t !== "") return t;
  }
  return null;
};

/**
 * GET /sensores devuelve la forma de SensorPublico del backend:
 * nombreSensor, tipo, unidad, ultimoValor, ultimaMedicion, estadoConexion,
 * valorMinimoSensor, valorMaximoSensor, loteId, subLoteId, cultivoId.
 *
 * Antes este normalizador buscaba nombre / ultimo_valor / rango_min, que no
 * existen en ninguna respuesta: todos los sensores caian a nombre "Sensor",
 * valor null y enLinea false, y el panel mostraba "Sensores activos 0/N".
 */
function normalizar(s: Raw): Sensor {
  const ultimaLectura = primerTexto(s.ultimaMedicion, s.ultimaVistaEn);
  const valor = num(s.ultimoValor);
  const min = num(s.valorMinimoSensor);
  const max = num(s.valorMaximoSensor);

  const estadoConexion = primerTexto(s.estadoConexion)?.toLowerCase() ?? null;
  const enLinea = estadoConexion === "conectado";

  const fuera = valor !== null && ((min !== null && valor < min) || (max !== null && valor > max));

  return {
    id: num(s.id) ?? 0,
    nombre: primerTexto(s.nombreSensor) ?? "Sensor",
    tipo: detectarTipo(primerTexto(s.tipo) ?? primerTexto(s.nombreSensor) ?? ""),
    // El backend no manda el nombre del lote: la pantalla lo resuelve con loteId
    ubicacion: "",
    unidad: primerTexto(s.unidad) ?? "",
    valor,
    min,
    max,
    ultimaLectura,
    enLinea,
    alerta: enLinea && fuera,
    loteId: num(s.loteId),
    subLoteId: num(s.subLoteId),
    cultivoId: num(s.cultivoId),
  };
}

export async function getSensores(signal?: AbortSignal): Promise<Sensor[]> {
  const json = await apiGet<Raw[] | Raw>("/sensores", signal);
  const comoArreglo = (v: unknown): Raw[] | null => (Array.isArray(v) ? (v as Raw[]) : null);
  const lista: Raw[] =
    comoArreglo(json) ?? comoArreglo((json as Raw).sensores) ?? comoArreglo((json as Raw).data) ?? [];
  return lista.map(normalizar);
}
