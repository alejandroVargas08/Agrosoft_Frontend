import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Notificacion, notificacionesApi } from '../../api/notificaciones/notificaciones';
import { InicioUsuario } from '../useAuth';

export function useNotificaciones(intervaloMs = 30000) {
  const { user } = InicioUsuario();
  const usuarioId: number | undefined = user?.id;

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(Boolean(usuarioId));
  const [error, setError] = useState<string | null>(null);
  const [nuevas, setNuevas] = useState<Notificacion[]>([]);
  const idsVistos = useRef<Set<number> | null>(null);

  const cargar = useCallback(async () => {
    if (!usuarioId) return;
    try {
      const data = await notificacionesApi.listar(usuarioId);
      const vistos = idsVistos.current;
      if (vistos) {
        const recientes = data.filter((n) => !n.leida && !vistos.has(n.id));
        if (recientes.length > 0) setNuevas((prev) => [...recientes, ...prev].slice(0, 3));
      }
      idsVistos.current = new Set(data.map((n) => n.id));
      setNotificaciones(data);
      setError(null);
    } catch {
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    if (!usuarioId) return;
    cargar();
    const id = setInterval(cargar, intervaloMs);
    return () => clearInterval(id);
  }, [cargar, intervaloMs, usuarioId]);

  const marcarLeida = useCallback(
    async (id: number) => {
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
      );
      setNuevas((prev) => prev.filter((n) => n.id !== id));
      try {
        await notificacionesApi.marcarLeida(id);
      } catch {
        cargar();
      }
    },
    [cargar],
  );

  const marcarTodasLeidas = useCallback(async () => {
    const pendientes = notificaciones.filter((n) => !n.leida);
    if (pendientes.length === 0) return;

    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNuevas([]);
    try {
      await Promise.all(pendientes.map((n) => notificacionesApi.marcarLeida(n.id)));
    } catch {
      cargar();
    }
  }, [notificaciones, cargar]);

  const descartarNueva = useCallback((id: number) => {
    setNuevas((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const sinLeer = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones],
  );

  return {
    notificaciones,
    cargando,
    error,
    sinLeer,
    nuevas,
    descartarNueva,
    marcarLeida,
    marcarTodasLeidas,
    recargar: cargar,
  };
}