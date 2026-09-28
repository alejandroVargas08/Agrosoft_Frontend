import { useEffect, useState } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    setCargando(true);
    listarConversaciones(usuarioId)
      .then(setConversaciones)
      .finally(() => setCargando(false));
  }, [usuarioId, refrescarSenal]);

  async function handleEliminar(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    await eliminarConversacion(id);
    setConversaciones((prev) => prev.filter((c) => c.id !== id));
    if (conversacionActivaId === id) onSeleccionar(null);
  }

  return (
    <div className="w-full h-full flex flex-col bg-neutral-50 border-r border-neutral-200">
      <div className="p-3 border-b border-neutral-200">
        <button
          onClick={onNuevaConversacion}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva conversación
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {cargando && <p className="text-xs text-neutral-400 text-center py-4">Cargando conversaciones...</p>}
        {!cargando && conversaciones.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-4">Aún no tienes conversaciones.</p>
        )}
        {conversaciones.map((c) => (
          <button
            key={c.id}
            onClick={() => onSeleccionar(c.id)}
            className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg text-sm transition-colors group ${
              conversacionActivaId === c.id
                ? 'bg-emerald-50 text-emerald-700 font-medium'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{c.titulo}</span>
            <span
              role="button"
              onClick={(e) => handleEliminar(e, c.id)}
              className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 transition-opacity"
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
