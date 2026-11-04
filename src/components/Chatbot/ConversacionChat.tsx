import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Sparkles, X, Send } from 'lucide-react';
import { crearConversacion, obtenerMensajes, enviarMensaje, enviarImagenes } from '../../services/iaService';
import type { MensajeIA } from '../../services/iaService';
import Agrosoft from '../../assets/img/agrosoft.png';

interface ConversacionChatProps {
  usuarioId: number;
  nombreUsuario?: string;
  conversacionId: number | null;
  onConversacionCreada: (id: number) => void;
}

const MAX_IMAGENES = 5;

export function ConversacionChat({
  usuarioId,
  nombreUsuario = 'Usuario',
  conversacionId,
  onConversacionCreada,
}: ConversacionChatProps) {
  const [mensajes, setMensajes] = useState<MensajeIA[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [texto, setTexto] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const finRef = useRef<HTMLDivElement>(null);
  const conversacionIdRef = useRef<number | null>(conversacionId);
  const creandoConversacionRef = useRef(false);

  const sugerencias = [
    '¿Qué plagas son comunes en el Café?',
    'Analiza los síntomas de mi cultivo',
    '¿Cómo tratar la broca en mi cultivo?',
    'Revisa los niveles del sensor Lote A',
  ];

  useEffect(() => {
    conversacionIdRef.current = conversacionId;

    if (creandoConversacionRef.current) {
      creandoConversacionRef.current = false;
      return;
    }

    if (!conversacionId) {
      setMensajes([]);
      return;
    }
    setCargandoHistorial(true);
    obtenerMensajes(conversacionId)
      .then(setMensajes)
      .catch(() => setError('No se pudo cargar el historial.'))
      .finally(() => setCargandoHistorial(false));
  }, [conversacionId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, enviando]);

  function agregarArchivos(nuevos: FileList | null) {
    if (!nuevos) return;
    setArchivos((prev) => [...prev, ...Array.from(nuevos)].slice(0, MAX_IMAGENES));
  }

  function quitarArchivo(index: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  }

  async function asegurarConversacion(): Promise<number> {
    if (conversacionId) return conversacionId;
    const primerTexto = texto.trim();
    const titulo = primerTexto ? primerTexto.slice(0, 40) : 'Nueva conversación';
    const nueva = await crearConversacion(usuarioId, titulo);
    conversacionIdRef.current = nueva.id;
    creandoConversacionRef.current = true;
    onConversacionCreada(nueva.id);
    return nueva.id;
  }

  async function handleEnviar(textoAEnviar?: string) {
    if (enviando) return;

    const textoFinal = (textoAEnviar ?? texto).trim();
    if (!textoFinal && archivos.length === 0) return;

    const conversacionOrigen = conversacionId;
    setEnviando(true);
    setError('');

    const mensajeOptimista: MensajeIA = {
      id: Date.now(),
      rol: 'user',
      contenido: textoFinal,
      tieneImagenes: archivos.length > 0,
      cantidadImagenes: archivos.length,
      creadoEn: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, mensajeOptimista]);
    setTexto('');
    const archivosAEnviar = archivos;
    setArchivos([]);

    try {
      const id = await asegurarConversacion();
      let respuesta: string;
      if (archivosAEnviar.length > 0) {
        respuesta = await enviarImagenes(
          id,
          archivosAEnviar,
          textoFinal || 'Analiza estas imágenes de un cultivo agrícola. Indica el estado de las hojas, posibles plagas o enfermedades, y recomendaciones.',
        );
      } else {
        respuesta = await enviarMensaje(id, textoFinal);
      }

      if (conversacionIdRef.current !== id) {
        return;
      }

      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          rol: 'assistant',
          contenido: respuesta,
          tieneImagenes: false,
          cantidadImagenes: 0,
          creadoEn: new Date().toISOString(),
        },
      ]);
    } catch {
      if (conversacionIdRef.current === conversacionOrigen) {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setEnviando(false);
    }
  }

  const sinMensajes = mensajes.length === 0 && !cargandoHistorial;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col">
        {sinMensajes ? (
          <div className="w-full flex flex-col items-center text-center mt-4 flex-1 justify-center">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md mb-3">
              <img src={Agrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Hola, {nombreUsuario} 👋</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Soy <span className="font-semibold text-foreground">AgroBot</span>. Pregúntame sobre cultivos, plagas o envíame fotos para analizarlas.
            </p>
            <div className="w-full max-w-md flex flex-col gap-2 mt-6">
              {sugerencias.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleEnviar(s)}
                  className="flex items-center gap-2 text-xs sm:text-sm text-foreground bg-white border border-border rounded-full px-4 py-2.5 shadow-sm hover:bg-primary/5 hover:border-primary/40 transition-all text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={2.5} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3 max-w-2xl mx-auto">
            {cargandoHistorial && (
              <div className="text-center text-sm text-muted-foreground py-6">Cargando conversación...</div>
            )}
            {mensajes.map((m) => (
              <div key={m.id} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line shadow-sm ${
                    m.rol === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  {m.tieneImagenes && (
                    <div className={`text-xs mb-1 ${m.rol === 'user' ? 'text-white/70' : 'text-primary'}`}>
                      📎 {m.cantidadImagenes} imagen(es) adjunta(s)
                    </div>
                  )}
                  {m.contenido}
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-muted-foreground animate-pulse">
                  AgroBot está escribiendo...
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            <div ref={finRef} />
          </div>
        )}
      </div>

      <div
        className="p-3 bg-white border-t border-border shrink-0"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {archivos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 max-w-2xl mx-auto">
            {archivos.map((archivo, index) => (
              <div
                key={`${archivo.name}-${index}`}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full px-3 py-1.5 max-w-full"
              >
                <span className="truncate max-w-[140px]">📎 {archivo.name}</span>
                <button
                  type="button"
                  onClick={() => quitarArchivo(index)}
                  className="text-primary hover:text-primary/70 shrink-0"
                  aria-label={`Quitar ${archivo.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center border border-border rounded-full px-3 py-1.5 focus-within:border-primary/40 transition-colors shadow-sm max-w-2xl mx-auto">
          <label
            className={`cursor-pointer mr-2 flex items-center ${
              archivos.length >= MAX_IMAGENES ? 'text-muted pointer-events-none' : 'text-muted-foreground hover:text-primary'
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
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !enviando && handleEnviar()}
            placeholder="Escribe tu consulta..."
            className="w-full text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
          />

          <button
            onClick={() => handleEnviar()}
            disabled={enviando || (!texto && archivos.length === 0)}
            className="ml-2 bg-primary text-white rounded-full p-2 hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        {archivos.length >= MAX_IMAGENES && (
          <p className="text-[10px] text-center text-[#F16C07] mt-1">Máximo {MAX_IMAGENES} imágenes por consulta.</p>
        )}
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          AgroBot puede cometer errores. Verifica con un agrónomo.
        </p>
      </div>
    </div>
  );
}
