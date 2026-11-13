import { useEffect, useRef, useState } from 'react';
import { Bot, ImagePlus, Sparkles, X, Send } from 'lucide-react';
import { toast } from 'sonner';
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
const MAX_BYTES = 5 * 1024 * 1024;

/** Lo que se ve en pantalla: las fotos recién enviadas se muestran con una URL
 *  local, porque el historial del backend solo guarda cuántas fueron. */
type Mensaje = MensajeIA & { imagenesLocales?: string[] };

// Las respuestas traen **negritas** en markdown, como en el diseño
const negritas = (texto: string) =>
  texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**')
      ? <strong key={i}>{parte.slice(2, -2)}</strong>
      : <span key={i}>{parte}</span>,
  );

// El modelo también manda títulos (### ...) y viñetas (* ...): sin esto se
// verían los símbolos tal cual
const conNegritas = (texto: string) =>
  texto.split('\n').map((linea, i, todas) => {
    const salto = i < todas.length - 1 ? '\n' : '';
    const titulo = linea.match(/^\s*#{1,6}\s+(.*)$/);
    if (titulo) return <strong key={i} className="block mt-1">{negritas(titulo[1])}{salto}</strong>;
    const vineta = linea.match(/^(\s*)[*-]\s+(.*)$/);
    if (vineta) return <span key={i}>{vineta[1]}• {negritas(vineta[2])}{salto}</span>;
    return <span key={i}>{negritas(linea)}{salto}</span>;
  });

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

/** Los tres puntos del diseño mientras AgroBot responde */
const Escribiendo = () => (
  <div className="flex items-center gap-1 px-1 py-0.5">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
);

export function ConversacionChat({
  usuarioId,
  nombreUsuario = 'Usuario',
  conversacionId,
  onConversacionCreada,
}: ConversacionChatProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
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
    const lista = Array.from(nuevos);
    const validas = lista.filter((f) => f.size <= MAX_BYTES);
    if (validas.length < lista.length) toast.error('Máximo 5 MB');
    setArchivos((prev) => [...prev, ...validas].slice(0, MAX_IMAGENES));
  }

  function quitarArchivo(index: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  }

  // El título es el primer mensaje: el escrito o la sugerencia que se tocó
  async function asegurarConversacion(primerMensaje: string): Promise<number> {
    if (conversacionId) return conversacionId;
    const primerTexto = primerMensaje.trim();
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

    const mensajeOptimista: Mensaje = {
      id: Date.now(),
      rol: 'user',
      contenido: textoFinal,
      tieneImagenes: archivos.length > 0,
      cantidadImagenes: archivos.length,
      creadoEn: new Date().toISOString(),
      imagenesLocales: archivos.map((f) => URL.createObjectURL(f)),
    };
    setMensajes((prev) => [...prev, mensajeOptimista]);
    setTexto('');
    const archivosAEnviar = archivos;
    setArchivos([]);

    // La conversación de este envío: en una nueva, la que se acaba de crear
    let idEnvio: number | null = conversacionOrigen;
    try {
      const id = await asegurarConversacion(textoFinal);
      idEnvio = id;
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
    } catch (e) {
      // Antes se comparaba con la conversación de origen, que en una nueva es
      // null: el error se descartaba y no se veía nada
      if (conversacionIdRef.current === idEnvio) {
        const detalle = e instanceof Error ? e.message.replace(/^Error \d+:\s*/, '') : '';
        setError(detalle && !/internal server error/i.test(detalle) ? detalle : 'AgroBot no pudo responder. Intenta de nuevo.');
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
            {mensajes.map((m) => {
              const esUsuario = m.rol === 'user';
              return (
                <div key={m.id} className={`flex gap-3 ${esUsuario ? 'flex-row-reverse' : 'flex-row'}`}>
                  {esUsuario ? (
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold text-primary">
                      {nombreUsuario.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-1.5 max-w-[75%] ${esUsuario ? 'items-end' : 'items-start'}`}>
                    {m.imagenesLocales && m.imagenesLocales.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {m.imagenesLocales.map((url) => (
                          <div key={url} className="rounded-xl overflow-hidden border border-border">
                            <img src={url} alt="Imagen" className="max-w-xs max-h-48 object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : m.tieneImagenes ? (
                      <p className="text-xs text-muted-foreground">📎 {m.cantidadImagenes} imagen(es) adjunta(s)</p>
                    ) : null}
                    {m.contenido && (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                          esUsuario ? 'bg-primary text-white rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'
                        }`}
                      >
                        {conNegritas(m.contenido)}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground px-1">{hora(m.creadoEn)}</p>
                  </div>
                </div>
              );
            })}
            {enviando && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3"><Escribiendo /></div>
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
          <div className="flex items-center gap-2 pb-2 max-w-2xl mx-auto flex-wrap">
            {archivos.map((archivo, index) => (
              <div key={`${archivo.name}-${index}`} className="relative shrink-0">
                <img
                  src={URL.createObjectURL(archivo)}
                  alt={archivo.name}
                  className="w-10 h-10 rounded-lg object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => quitarArchivo(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center"
                  aria-label={`Quitar ${archivo.name}`}
                >
                  <X size={8} />
                </button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {archivos.length === 1 ? 'Imagen adjunta.' : `${archivos.length} imágenes adjuntas.`}
            </p>
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
