import { useEffect, useState } from 'react';
import { InicioUsuario } from './useAuth';
import { usuarioApi } from '../api/usuarios/usuarios';
import type { Usuario } from '../api/usuarios/usuarios';

interface ProgramaFormacion {
  nombre: string;
  tipo: string;
  ficha: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

/** El backend devuelve `correo`; aquí no se inventa un `email`. */
interface PerfilUsuario extends Usuario {
  ubicacion?: string;
  rol?: string;
  emailVerificado?: boolean;
  programaFormacion?: ProgramaFormacion;
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

  const actualizarPerfil = async (datos: Partial<PerfilUsuario>) => {
    if (!user?.id) return;
    const { data } = await usuarioApi.actualizar(user.id, datos);
    setPerfil((prev) => (prev ? { ...prev, ...data } : data));
    return data;
  };

  return { perfil, cargando, error, actualizarPerfil };
}