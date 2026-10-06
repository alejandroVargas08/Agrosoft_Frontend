import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Notificacion, notificacionesApi } from '../../api/notificaciones/notificaciones';
import { InicioUsuario } from '../useAuth';

export function useNotificaciones(intervaloMs = 30000) {
  const { user } = InicioUsuario();
  const usuarioId: number | undefined = user?.id; // ajusta al nombre real del campo

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!usuarioId) return;
    try {
      const data = await notificacionesApi.listar(usuarioId);
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
    try {
      await Promise.all(pendientes.map((n) => notificacionesApi.marcarLeida(n.id)));
    } catch {
      cargar();
    }
  }, [notificaciones, cargar]);

  const sinLeer = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones],
  );

  return {
    notificaciones,
    cargando,
    error,
    sinLeer,
    marcarLeida,
    marcarTodasLeidas,
    recargar: cargar,
  };
}