import { useState, useEffect } from "react";

interface UsuarioRespuesta {
  id: number;
  nombre: string;
  apellido: string;
  identificacion: string;
  correo: string;
  telefono: string;
  rolId: number;
}

function EditarPerfil() {
  const [usuario, setUsuario] = useState<UsuarioRespuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario (separados del "usuario" original para poder comparar/cancelar)
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState(""); // TODO: no existe aún en backend

  useEffect(() => {
    // TODO: reemplazar por llamada real a la API cuando exista /auth y /usuarios/:id
    const usuarioMock: UsuarioRespuesta = {
      id: 1,
      nombre: "Nombre Usuario",
      apellido: "",
      identificacion: "Identidad",
      correo: "correo@ejemplo.com",
      telefono: "Tu telefono",
      rolId: 1,
    };

    setUsuario(usuarioMock);
    setNombreCompleto(`${usuarioMock.nombre} ${usuarioMock.apellido}`);
    setTelefono(usuarioMock.telefono);
    setCargando(false);
  }, []);

  const handleGuardar = () => {
    if (!nombreCompleto.trim()) {
      alert("El nombre completo es obligatorio");
      return;
    }

    setGuardando(true);

    // Separamos nombre completo en nombre/apellido para calzar con el DTO del backend
    const [nombre, ...resto] = nombreCompleto.trim().split(" ");
    const apellido = resto.join(" ");

    const datosActualizados = {
      nombre,
      apellido,
      telefono,
      // ubicacion, // TODO: agregar cuando el backend lo soporte
    };

    // TODO: reemplazar por api.patch(`/usuarios/${usuario?.id}`, datosActualizados) cuando exista el endpoint y el auth
    console.log("Tus datos son los siguientes:", datosActualizados);

    setTimeout(() => {
      setGuardando(false);
      alert("Cambio de perfil: EXCELENTE");
    }, 500);
  };

  const handleCancelar = () => {
    if (!usuario) return;
    setNombreCompleto(`${usuario.nombre} ${usuario.apellido}`);
    setTelefono(usuario.telefono);
    setUbicacion("");
  };

  if (cargando) {
    return <p>Cargando perfil...</p>;
  }

  return (
    <div className="editar-perfil">
      <h1>Editar Perfil</h1>

      <div className="editar-perfil__avatar">
        <div className="editar-perfil__avatar-circulo">
          {nombreCompleto.charAt(0).toUpperCase()}
        </div>
        <button type="button">Cambiar foto</button>
        {/* TODO: input file oculto + subida real cuando exista endpoint de foto */}
      </div>

      <label htmlFor="nombreCompleto">
        Nombre completo <span className="requerido">*</span>
      </label>
      <input
        id="nombreCompleto"
        type="text"
        value={nombreCompleto}
        onChange={(e) => setNombreCompleto(e.target.value)}
      />

      <label htmlFor="telefono">Teléfono</label>
      <input
        id="telefono"
        type="text"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      />

      <label htmlFor="ubicacion">Ubicación</label>
      <input
        id="ubicacion"
        type="text"
        value={ubicacion}
        onChange={(e) => setUbicacion(e.target.value)}
      />

      <div className="editar-perfil__acciones">
        <button type="button" onClick={handleGuardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
        <button type="button" onClick={handleCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default EditarPerfil;