const API_URL = `${import.meta.env.VITE_API_URL}/ia`;

export async function enviarMensaje(mensaje: string, contexto?: string): Promise<string>{
    const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({mensaje, contexto})
    });
    const data = await res.json();
  return data.respuesta;
}

export async function analizarImagen(archivo: File, prompt: string): Promise<string> {
  const base64 = await convertirABase64(archivo);
  const res = await fetch(`${API_URL}/analizar-imagen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imagen: base64, prompt }),
  });
  const data = await res.json();
  return data.respuesta;
}

function convertirABase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}
