const API_URL = `${import.meta.env.VITE_API_URL}/ia`;

export interface ConversacionIA {
  id: number;
  titulo: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface MensajeIA {
  id: number;
  rol: 'user' | 'assistant';
  contenido: string;
  tieneImagenes: boolean;
  cantidadImagenes: number;
  creadoEn: string;
}

function getHeaders(json = true): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    let detalle = res.statusText;
    try {
      const err = await res.json();
      detalle = err?.message ?? detalle;
    } catch {
     
    }
    throw new Error(`Error ${res.status}: ${detalle}`);
  }

  const texto = await res.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}

export async function listarConversaciones(usuarioId: number): Promise<ConversacionIA[]> {
  try {
    const data = await request<ConversacionIA[] | { data?: ConversacionIA[] }>(
      `${API_URL}/conversaciones/usuario/${usuarioId}`,
      { headers: getHeaders(false) },
    );
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.data) ? data.data : [];
  } catch (error) {
    console.error('Error listando conversaciones:', error);
    return [];
  }
}

export async function crearConversacion(usuarioId: number, titulo?: string): Promise<ConversacionIA> {
  return request<ConversacionIA>(`${API_URL}/conversaciones`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ usuarioId, titulo }),
  });
}

export async function obtenerMensajes(conversacionId: number): Promise<MensajeIA[]> {
  try {
    const data = await request<MensajeIA[]>(
      `${API_URL}/conversaciones/${conversacionId}/mensajes`,
      { headers: getHeaders(false) },
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    return [];
  }
}

export async function enviarMensaje(conversacionId: number, mensaje: string): Promise<string> {
  const data = await request<{ respuesta: string }>(
    `${API_URL}/conversaciones/${conversacionId}/chat`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mensaje }),
    },
  );
  return data.respuesta;
}

export async function enviarImagenes(
  conversacionId: number,
  archivos: File[],
  prompt: string,
): Promise<string> {
  const imagenes = await Promise.all(archivos.map(convertirABase64));
  const data = await request<{ respuesta: string }>(
    `${API_URL}/conversaciones/${conversacionId}/analizar-imagen`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ imagenes, prompt }),
    },
  );
  return data.respuesta;
}

export async function eliminarConversacion(conversacionId: number): Promise<void> {
  await request<void>(`${API_URL}/conversaciones/${conversacionId}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  });
}

function convertirABase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}
