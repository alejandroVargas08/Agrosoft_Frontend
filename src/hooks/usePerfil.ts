import { useEffect, useState } from 'react';
import { InicioUsuario } from './useAuth';
import { usuarioApi } from '../api/usuarios/usuarios';
import type { ActualizarUsuario } from '../api/usuarios/usuarios';

interface ProgramaFormacion {
  nombre: string;
  tipo: string;
  ficha: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

/**
 * Lo que devuelve `GET /usuarios/:id`, que NO es el mismo objeto que el resto
 * de endpoints de usuario: trae el programa de formación resuelto y el nombre
 * del rol, pero no la solicitud ni las fechas. Se declara tal cual llega.
 */
interface PerfilUsuario {
  id: number;
  nombre: string;
  apellido: string;
  identificacion: string;
  correo: string;
  telefono: string;
  estado: string;
  correoVerificado: boolean;
  rolId: number;
  rol: string | null;
  programaFormacion: ProgramaFormacion | null;
  /** No existe en el backend todavía; la pantalla lo muestra como "No registrada". */
  ubicacion?: string;
}

export function usePerfil() {
  const { user } = InicioUsuario();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!user?.id) {
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError(null);
        const { data } = await usuarioApi.obtenerPorId(user.id);
        setPerfil(data);
      } catch (err) {
        console.error('Error al cargar el perfil:', err);
        setError('No se pudo cargar la información del perfil');
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [user?.id]);

  // PATCH devuelve UsuarioPublico, que tiene otra forma: solo se refrescan
  // los campos que los dos comparten, para no romper el resto del perfil.
  const actualizarPerfil = async (datos: ActualizarUsuario) => {
    if (!user?.id) return;
    const { data } = await usuarioApi.actualizar(user.id, datos);
    setPerfil((prev) =>
      prev
        ? { ...prev, nombre: data.nombre, apellido: data.apellido, correo: data.correo, telefono: data.telefono, estado: data.estado }
        : prev,
    );
    return data;
  };

  return { perfil, cargando, error, actualizarPerfil };
}