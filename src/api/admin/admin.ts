import { api } from '../axios';
import type { Lote } from '../../types/territorio';
import type { ConfigIot, DatosFicha, FichaResumen, NuevaConfigIot, NuevoUsuario, Permiso, ResultadoContrasena, Rol, RolPermiso, UsuarioAdmin } from '../../types/admin/admin';

export const usuariosAdminApi = {
    listar: () => api.get<UsuarioAdmin[]>('/usuarios'),
    actualizar: (id: number, datos: { nombre?: string; apellido?: string; correo?: string; telefono?: string }) => api.patch(`/usuarios/${id}`, datos),
    solicitudes: () => api.get<UsuarioAdmin[]>('/usuarios/solicitudes'),
    crear: (datos: NuevoUsuario) => api.post<UsuarioAdmin>('/usuarios', datos),
    cambiarEstado: (id: number, estado: 'activo' | 'inactivo') => api.patch(`/usuarios/${id}`, { estado }),
    cambiarRol: (id: number, rolId: number) => api.patch<UsuarioAdmin>(`/usuarios/${id}/rol`, { rolId }),
    cambiarFicha: (id: number, programaFormacionId: number | null) => api.patch<UsuarioAdmin>(`/usuarios/${id}/programa`, { programaFormacionId }),
    aprobar: (id: number) => api.patch<UsuarioAdmin>(`/usuarios/${id}/aprobar`),
    rechazar: (id: number, motivo: string) => api.patch<UsuarioAdmin>(`/usuarios/${id}/rechazar`, { motivo }),
    restablecerContrasena: (id: number, nuevaContrasena?: string) =>
        api.patch<ResultadoContrasena>(`/usuarios/${id}/contrasena`, nuevaContrasena ? { nuevaContrasena } : {}),
    eliminar: (id: number) => api.delete(`/usuarios/${id}`),
    fichasACargo: (id: number) => api.get<number[]>(`/usuarios/${id}/programas`),
    asignarFicha: (id: number, programaFormacionId: number) => api.post<number[]>(`/usuarios/${id}/programas`, { programaFormacionId }),
    quitarFicha: (id: number, programaFormacionId: number) => api.delete<number[]>(`/usuarios/${id}/programas/${programaFormacionId}`),
};

export const rolesAdminApi = {
    listar: () => api.get<Rol[]>('/roles'),
    crear: (nombre: string, descripcion: string) => api.post<Rol>('/roles', { nombre, descripcion }),
    permisos: () => api.get<Permiso[]>('/permisos'),
    permisosDeRol: (rolId: number) => api.get<RolPermiso[]>(`/rol-permisos/${rolId}`),
    asignarPermiso: (rolId: number, permisoId: number) => api.post('/rol-permisos', { rolId, permisoId }),
    quitarPermiso: (rolId: number, permisoId: number) => api.delete(`/rol-permisos/${rolId}/${permisoId}`),
};

export const fichasAdminApi = {
    resumen: () => api.get<FichaResumen[]>('/programas-formacion/resumen'),
    crear: (datos: DatosFicha) => api.post<FichaResumen>('/programas-formacion', datos),
    actualizar: (id: number, datos: Partial<DatosFicha>) => api.patch(`/programas-formacion/${id}`, datos),
};

export const lotesAdminApi = {
    listar: () => api.get<Lote[]>('/territorio/lotes'),
    asignarFicha: (loteId: number, programaFormacionId: number | null) =>
        api.patch<Lote>(`/territorio/lotes/${loteId}/programa`, { programaFormacionId }),
};

export const iotConfigApi = {
    listar: () => api.get<ConfigIot[]>('/iot-global-config'),
    crear: (datos: NuevaConfigIot) => api.post<ConfigIot>('/iot-global-config', datos),
    actualizar: (id: number, datos: Partial<NuevaConfigIot>) => api.patch<ConfigIot>(`/iot-global-config/${id}`, datos),
};
