import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { CerrarSesionModal } from "../ui/CerrarSesionModal";

export function BotonCerrarSesion() {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    // Si el backend tiene endpoint de logout, descomenta:
    // await api.post("/auth/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setAbierto(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[#D32F2F] transition hover:bg-[#FDECEC]"
      >
        <LogOut className="h-5 w-5" />
        Cerrar sesión
      </button>

      <CerrarSesionModal
        abierto={abierto}
        onCancelar={() => setAbierto(false)}
        onConfirmar={cerrarSesion}
      />
    </>
  );
}
