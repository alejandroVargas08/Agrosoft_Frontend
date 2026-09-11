import { useState } from 'react';
import { enviarMensaje, analizarImagen } from '../../services/iaService';

export function ChatbotIA() {
  const [mensaje, setMensaje] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleEnviar = async () => {
    if (!mensaje && !archivo) return;
    setCargando(true);
    setError('');
    setRespuesta('');

    try {
      let res: string;
      if (archivo) {
        res = await analizarImagen(
          archivo,
          mensaje || 'Analiza esta imagen de un cultivo agrícola. Indica el estado de las hojas, posibles plagas o enfermedades, y recomendaciones.',
        );
      } else {
        res = await enviarMensaje(mensaje);
      }
      setRespuesta(res);
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full h-full max-w-md border-2 border-black rounded-lg p-4 flex flex-col gap-2">
      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        className="w-full h-20 border border-neutral-300 rounded-lg p-2 text-sm shrink-0"
        placeholder="Escribe tu pregunta o describe la imagen..."
      />

      <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer shrink-0">
        <span className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50">
          Sube tu imagen
        </span>
        <span className="truncate">{archivo ? archivo.name : 'Ninguna imagen seleccionada'}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
        />
      </label>

      <button
        onClick={handleEnviar}
        disabled={cargando || (!mensaje && !archivo)}
        className="mt-1 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50 shrink-0"
      >
        {cargando ? (archivo ? 'Analizando...' : 'Respondiendo...') : 'Enviar'}
      </button>

      <div className="flex-1 overflow-y-auto mt-2 pr-1">
        {respuesta && <p className="text-sm whitespace-pre-line">{respuesta}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}