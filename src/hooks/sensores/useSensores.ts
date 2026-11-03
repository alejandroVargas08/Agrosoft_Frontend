import { useCallback, useEffect, useRef, useState } from "react";
import { getSensores } from "../../services/sensorService";
import type { Sensor } from "../../types/sensor";

export function useSensores(intervaloMs = 10_000) {
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const recargar = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      setSensores(await getSensores(ctrl.signal));
      setError(null);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      if (!ctrl.signal.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
    const id = setInterval(recargar, intervaloMs);
    const onVisible = () => !document.hidden && recargar();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      abortRef.current?.abort();
    };
  }, [recargar, intervaloMs]);

  // El resumen ahora se calcula por estacion, en useSensoresPorLote.
  return { sensores, cargando, error, recargar };
}