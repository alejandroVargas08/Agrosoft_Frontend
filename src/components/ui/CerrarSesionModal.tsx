import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

interface CerrarSesionModalProps {
  abierto: boolean;
  onCancelar: () => void;
  onConfirmar: () => Promise<void> | void;
}

export function CerrarSesionModal({ abierto, onCancelar, onConfirmar }: CerrarSesionModalProps) {
  const [cargando, setCargando] = useState(false);
  const botonCancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    botonCancelarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !cargando) onCancelar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, cargando, onCancelar]);

  if (!abierto) return null;

  const confirmar = async () => {
    setCargando(true);
    try {
      await onConfirmar();
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => !cargando && onCancelar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cerrar-sesion"
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-5">
          <h2 id="titulo-cerrar-sesion" className="text-xl font-bold text-[#111827]">
            Cerrar sesión
          </h2>
          <button
            onClick={onCancelar}
            disabled={cargando}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-[#374151] transition hover:bg-[#F3F4F6] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-[15px] text-[#374151]">
            ¿Estás seguro de que deseas cerrar sesión?
          </p>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              onClick={confirmar}
              disabled={cargando}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D32F2F] py-3 font-semibold text-white transition hover:bg-[#B71C1C] disabled:opacity-70"
            >
              {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
              {cargando ? "Cerrando..." : "Cerrar sesión"}
            </button>
            <button
              ref={botonCancelarRef}
              onClick={onCancelar}
              disabled={cargando}
              className="flex-1 rounded-xl border border-[#E5E7EB] bg-white py-3 font-semibold text-[#111827] transition hover:bg-[#F9FAFB] disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
