import { useEffect, useState } from 'react';
import { Plus, MessageCircle, Trash2 } from 'lucide-react';
import { listarConversaciones, eliminarConversacion } from '../../services/iaService';
import type { ConversacionIA } from '../../services/iaService';

interface ListaConversacionesProps {
  usuarioId: number;
  conversacionActivaId: number | null;
  onSeleccionar: (id: number | null) => void;
  onNuevaConversacion: () => void;
  refrescarSenal: number;
}

export function ListaConversaciones({
  usuarioId,
  conversacionActivaId,
  onSeleccionar,
  onNuevaConversacion,
  refrescarSenal,
}: ListaConversacionesProps) {
  const [conversaciones, setConversaciones] = useState<ConversacionIA[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    listarConversaciones(usuarioId)
      .then((data) => {
        if (activo) setConversaciones(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Error cargando conversaciones:', err);
        if (activo) {
          setConversaciones([]);
          setError('No se pudieron cargar las conversaciones.');
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [usuarioId, refrescarSenal]);

  async function handleEliminar(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    try {
      await eliminarConversacion(id);
      setConversaciones((prev) => prev.filter((c) => c.id !== id));
      if (conversacionActivaId === id) onSeleccionar(null);
    } catch (err) {
      console.error('Error eliminando conversación:', err);
      setError('No se pudo eliminar la conversación.');
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3">
        <button
          onClick={onNuevaConversacion}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Nueva conversación
        </button>
      </div>
      <div className="border-t border-border" />

      <div className="flex-1 overflow-y-auto">
        {cargando && (
          <p className="text-xs text-muted-foreground text-center py-4">Cargando conversaciones...</p>
        )}
        {error && <p className="text-xs text-red-600 text-center py-4">{error}</p>}
        {!cargando && !error && conversaciones.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Aún no tienes conversaciones.</p>
        )}
        {Array.isArray(conversaciones) &&
          conversaciones.map((c) => (
            <button
              key={c.id}
              onClick={() => onSeleccionar(c.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 group"
            >
              <MessageCircle size={16} className="text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-sm text-foreground">{c.titulo}</span>
              {/* Borrar no está en el diseño: se deja oculto hasta pasar el mouse */}
              <span
                role="button"
                onClick={(e) => handleEliminar(e, c.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-opacity"
                aria-label="Eliminar conversación"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
