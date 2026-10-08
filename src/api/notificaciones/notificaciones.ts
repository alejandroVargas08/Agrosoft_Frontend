import { BASE_URL } from '../client'; 

export interface Notificacion {
  id: number;
  usuarioId: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadoEn: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const notificacionesApi = {
  listar: (usuarioId: number) =>
    request<Notificacion[]>(`/notificaciones/${usuarioId}`),
  marcarLeida: (id: number) =>
    request<void>(`/notificaciones/${id}/leida`, { method: 'PATCH' }),
};