import { useState } from 'react';
import { X, ImagePlus, Sparkles } from 'lucide-react';
import { enviarMensaje, analizarImagenes } from '../../services/iaService';
import Agrosoft from '../../assets/img/agrosoft.png';

interface ChatbotIAProps {
  nombreUsuario?: string;
}

const MAX_IMAGENES = 5;

export function ChatbotIA({ nombreUsuario = 'Manuel' }: ChatbotIAProps) {
  const [mensaje, setMensaje] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const sugerencias = [
    '¿Qué plagas son comunes en el Café?',
    'Analiza los síntomas de mi cultivo',
    '¿Cómo tratar la broca en mi cultivo?',
    'Revisa los niveles del sensor Lote A',
  ];

  function agregarArchivos(nuevos: FileList | null) {
    if (!nuevos) return;
    setArchivos((prev) => [...prev, ...Array.from(nuevos)].slice(0, MAX_IMAGENES));
  }

  function quitarArchivo(index: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  }

  const handleEnviar = async (textoAEnviar?: string) => {
    const textoFinal = textoAEnviar ?? mensaje;
    if (!textoFinal && archivos.length === 0) return;

    setCargando(true);
    setError('');
    setRespuesta('');

    try {
      let res: string;
      if (archivos.length > 0) {
        res = await analizarImagenes(
          archivos,
          textoFinal || 'Analiza estas imágenes de un cultivo agrícola. Indica el estado de las hojas, posibles plagas o enfermedades, y recomendaciones.',
        );
      } else {
        res = await enviarMensaje(textoFinal);
      }
      setRespuesta(res);
      setMensaje('');
      setArchivos([]);
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-green">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col items-center">
        {!respuesta && !cargando ? (
          <div className="w-full flex flex-col items-center text-center mt-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md mb-3">
              <img src={Agrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
            </div>

            <h2 className="text-xl font-bold text-neutral-800">
              Hola, {nombreUsuario} 👋
            </h2>
            <p className="text-sm text-neutral-500 mt-1 max-w-xs">
              Soy <span className="font-semibold text-neutral-700">AgroBot</span>. Pregúntame sobre cultivos, plagas o envíame fotos para analizarlas.
            </p>

            <div className="w-full flex flex-col gap-2 mt-6">
              {sugerencias.map((sugerencia, index) => (
                <button
                  key={index}
                  onClick={() => handleEnviar(sugerencia)}
                  className="flex items-center gap-2 text-xs sm:text-sm text-neutral-700 bg-white border border-neutral-200 rounded-full px-4 py-2.5 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-green-700 shrink-0" strokeWidth={2.5} />
                  {sugerencia}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            {cargando && (
              <div className="flex items-center justify-center py-10 text-emerald-700 text-sm font-medium animate-pulse">
                {archivos.length > 0 ? 'Analizando imágenes del cultivo...' : 'AgroBot está respondiendo...'}
              </div>
            )}
            {respuesta && (
              <div className="bg-green-50 border border-emerald-100 p-4 rounded-xl text-sm text-neutral-800 whitespace-pre-line shadow-sm">
                {respuesta}
              </div>
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

            {respuesta && (
              <button
                onClick={() => { setRespuesta(''); setArchivos([]); setMensaje(''); }}
                className="mt-2 text-xs text-green-700 underline self-center"
              >
                Hacer otra consulta
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className="p-3 bg-white border-t border-neutral-100 shrink-0"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {archivos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {archivos.map((archivo, index) => (
              <div
                key={`${archivo.name}-${index}`}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-full px-3 py-1.5 max-w-full"
              >
                <span className="truncate max-w-[140px]">🚜{archivo.name}</span>
                <button
                  type="button"
                  onClick={() => quitarArchivo(index)}
                  className="text-emerald-600 hover:text-emerald-900 shrink-0"
                  aria-label={`Quitar ${archivo.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center border border-neutral-300 rounded-full px-3 py-1.5 focus-within:border-emerald-600 transition-colors shadow-sm">
          <label
            className={`cursor-pointer mr-2 flex items-center ${
              archivos.length >= MAX_IMAGENES ? 'text-neutral-200 pointer-events-none' : 'text-neutral-400 hover:text-emerald-700'
            }`}
          >
            <ImagePlus className="w-5 h-5" strokeWidth={2} />
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => agregarArchivos(e.target.files)}
            />
          </label>

          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
            placeholder="Escribe tu consulta..."
            className="w-full text-sm focus:outline-none bg-transparent text-neutral-700 placeholder-neutral-400"
          />

          <button
            onClick={() => handleEnviar()}
            disabled={cargando || (!mensaje && archivos.length === 0)}
            className="ml-2 bg-emerald-600 text-white rounded-full p-2 hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center justify-center shrink-0"
          >
            <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
        {archivos.length >= MAX_IMAGENES && (
          <p className="text-[10px] text-center text-amber-600 mt-1">
            Máximo {MAX_IMAGENES} imágenes por consulta.
          </p>
        )}
        <p className="text-[10px] text-center text-neutral-400 mt-2">
          AgroBot puede cometer errores. Verifica con un agrónomo.
        </p>
      </div>
    </div>
  );
}
