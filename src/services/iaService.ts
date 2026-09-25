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

export async function listarConversaciones(usuarioId: number): Promise<ConversacionIA[]> {
  const res = await fetch(`${API_URL}/conversaciones/usuario/${usuarioId}`);
  return res.json();
}

export async function crearConversacion(usuarioId: number, titulo?: string): Promise<ConversacionIA> {
  const res = await fetch(`${API_URL}/conversaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuarioId, titulo }),
  });
  return res.json();
}

export async function obtenerMensajes(conversacionId: number): Promise<MensajeIA[]> {
  const res = await fetch(`${API_URL}/conversaciones/${conversacionId}/mensajes`);
  return res.json();
}

export async function enviarMensaje(conversacionId: number, mensaje: string): Promise<string> {
  const res = await fetch(`${API_URL}/conversaciones/${conversacionId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensaje }),
  });
  const data = await res.json();
  return data.respuesta;
}

export async function enviarImagenes(conversacionId: number, archivos: File[], prompt: string): Promise<string> {
  const imagenes = await Promise.all(archivos.map(convertirABase64));
  const res = await fetch(`${API_URL}/conversaciones/${conversacionId}/analizar-imagen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imagenes, prompt }),
  });
  const data = await res.json();
  return data.respuesta;
}

export async function eliminarConversacion(conversacionId: number): Promise<void> {
  await fetch(`${API_URL}/conversaciones/${conversacionId}`, { method: 'DELETE' });
}

function convertirABase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}
