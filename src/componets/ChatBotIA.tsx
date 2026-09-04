import { useState } from 'react';
import { enviarMensaje } from '../services/iaService';

export function ChatbotIA() {
  const [mensaje, setMensaje] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleEnviar = async () => {
    setCargando(true);
    const res = await enviarMensaje(mensaje);
    setRespuesta(res);
    setCargando(false);
  };

    return (
    <div className="max-w-md border-2 border-black rounded-lg p-4">
        <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        className="w-full h-20 border border-neutral-300 rounded-lg p-2 text-sm"
        placeholder="Escribe tu pregunta..."
        />
        <button
        onClick={handleEnviar}
        disabled={cargando}
        className="mt-2 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
        >
        {cargando ? 'Respondiendo...' : 'Enviar'}
        </button>
        <div>
        {respuesta && <p className="mt-2 text-sm">{respuesta}</p>}
        </div>
    </div>
    );
}