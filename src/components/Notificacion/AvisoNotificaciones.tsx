import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useNotificacionesContext } from '../../context/NotificacionesContext';
import type { Notificacion } from '../../api/notificaciones/notificaciones';

function Aviso({ notificacion, onDescartar }: { notificacion: Notificacion; onDescartar: (id: number) => void }) {
  const navigate = useNavigate();
  const onCerrar = () => onDescartar(notificacion.id);

  useEffect(() => {
    const id = setTimeout(() => onDescartar(notificacion.id), 8000);
    return () => clearTimeout(id);
  }, [notificacion.id, onDescartar]);

  return (
    <div className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-green-200 bg-white p-4 shadow-lg">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50">
        <Bell className="h-5 w-5 text-green-700" />
      </span>
      <button
        type="button"
        onClick={() => {
          onCerrar();
          navigate('/notificaciones');
        }}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <p className="truncate text-sm font-semibold text-gray-900">{notificacion.titulo}</p>
        <p className="line-clamp-2 text-sm text-gray-600">{notificacion.mensaje}</p>
      </button>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar aviso"
        className="cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function AvisoNotificaciones() {
  const { nuevas, descartarNueva } = useNotificacionesContext();

  if (nuevas.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-20 right-4 left-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-96">
      {nuevas.map((n) => (
        <Aviso key={n.id} notificacion={n} onDescartar={descartarNueva} />
      ))}
    </div>
  );
}