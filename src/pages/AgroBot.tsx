import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '../componets/layout/DashboardLayout';
import { usePerfil } from '../hooks/usePerfil';
import { ListaConversaciones } from '../componets/Chatbot/ListaConversaciones';
import { ConversacionChat } from '../componets/Chatbot/ConversacionChat';

export default function AgroBot() {
  const { perfil, cargando } = usePerfil();
  const [conversacionId, setConversacionId] = useState<number | null>(null);
  const [mostrarChat, setMostrarChat] = useState(false);
  const [refrescarSenal, setRefrescarSenal] = useState(0);

  if (cargando || !perfil) {
    return (
      <DashboardLayout unreadNotifications={2} mostrarChatFlotante={false}>
        <div className="p-4 sm:p-8">
          <div className="animate-pulse h-96 bg-gray-200 rounded-xl max-w-5xl" />
        </div>
      </DashboardLayout>
    );
  }

  function handleConversacionCreada(id: number) {
    setConversacionId(id);
    setRefrescarSenal((n) => n + 1);
  }

  function handleSeleccionar(id: number | null) {
    setConversacionId(id);
    setMostrarChat(id !== null);
  }

  function handleNuevaConversacion() {
    setConversacionId(null);
    setMostrarChat(true);
  }

  function handleVolver() {
    setConversacionId(null);
    setMostrarChat(false);
  }

  return (
    <DashboardLayout unreadNotifications={2} mostrarChatFlotante={!mostrarChat}>
      <div className="p-4 sm:p-8 h-[calc(100vh-5rem)]">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            {mostrarChat && (
              <button
                onClick={handleVolver}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                aria-label="Volver al historial"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {mostrarChat ? 'AgroBot' : 'Tus consultas en AgroBot'}
            </h1>
          </div>

          <div className="flex-1 min-h-0 rounded-xl shadow-sm overflow-hidden border border-neutral-200">
            {mostrarChat ? (
              <ConversacionChat
                usuarioId={perfil.id}
                nombreUsuario={perfil.nombre}
                conversacionId={conversacionId}
                onConversacionCreada={handleConversacionCreada}
              />
            ) : (
              <ListaConversaciones
                usuarioId={perfil.id}
                conversacionActivaId={conversacionId}
                onSeleccionar={handleSeleccionar}
                onNuevaConversacion={handleNuevaConversacion}
                refrescarSenal={refrescarSenal}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
