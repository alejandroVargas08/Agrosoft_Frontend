import { useState } from 'react';
import { Bot, ChevronDown } from 'lucide-react';
import { ConversacionChat } from './ConversacionChat';
import { usePerfil } from '../../hooks/usePerfil';

export default function ChatBotFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [conversacionId, setConversacionId] = useState<number | null>(null);
  const { perfil } = usePerfil();

  if (!perfil) return null;

  return (
    <>
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-emerald-700 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-xl hover:bg-emerald-800 transition-all"
        title="Abrir AgroBot"
      >
        <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
      </button>

      {abierto && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-96 h-[100dvh] sm:h-[540px] sm:max-h-[620px] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-white">
          <div
            className="bg-gradient-to-br from-emerald-900 to-emerald-600 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">AgroBot</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs text-emerald-100 font-medium">Asistente agrícola con IA</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAbierto(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Cerrar chat"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <ConversacionChat
              usuarioId={perfil.id}
              nombreUsuario={perfil.nombre}
              conversacionId={conversacionId}
              onConversacionCreada={setConversacionId}
            />
          </div>
        </div>
      )}
    </>
  );
}
