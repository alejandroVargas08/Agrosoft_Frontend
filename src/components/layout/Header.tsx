import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Bell, Menu } from 'lucide-react';
import { InicioUsuario } from '../../hooks/useAuth';
import { usePermisos } from '../../hooks/permisos/usePermisos';
import { misFichasApi } from '../../api/instructor';

interface HeaderProps {
    onMenuClick: () => void;
    unreadNotifications: number;
}

const GESTIONAR_USUARIOS = 'usuarios.gestionar';
const ASIGNAR_ACTIVIDADES = 'actividades.asignar';
const EJECUTAR_ACTIVIDADES = 'actividades.ejecutar';

export default function Header({ onMenuClick, unreadNotifications }: HeaderProps) {
    const { user } = InicioUsuario();
    const { puede } = usePermisos();
    const navigate = useNavigate();

    const displayName = user?.nombre || user?.nombres || user?.name || 'Usuario';
    const initial = displayName.charAt(0).toUpperCase();

    const esAdmin = puede(GESTIONAR_USUARIOS);
    const esInstructor = puede(ASIGNAR_ACTIVIDADES);
    const esAprendiz = puede(EJECUTAR_ACTIVIDADES);
    const rol = esAdmin ? 'Administrador' : esInstructor ? 'Instructor' : esAprendiz ? 'Aprendiz' : 'Usuario';

    // Comparte caché con la pantalla Mis Fichas: no es una consulta extra
    const fichasQuery = useQuery({
        queryKey: ['mis-fichas'],
        queryFn: async () => (await misFichasApi.listar()).data,
        enabled: esInstructor,
        staleTime: 1000 * 60 * 5,
    });
    const fichas = fichasQuery.data ?? [];

    return (
        <header className="fixed top-0 right-0 left-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:left-20 lg:left-64 lg:px-8">
            <button
                type="button"
                onClick={onMenuClick}
                className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                aria-label="Abrir menú de navegación"
            >
                <Menu className="h-5 w-5" />
            </button>

            <div className="hidden lg:block" />

            <div className="flex items-center gap-2 sm:gap-4">
                {/* El aprendiz reporta desde donde esté, sin ir primero a Mis Novedades */}
                {esAprendiz && !esInstructor && (
                    <button
                        type="button"
                        onClick={() => navigate('/mis-novedades?reportar=1')}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#FFF3E0] px-3 py-1.5 text-sm font-semibold text-[#F16C07] transition-colors hover:bg-[#FFE0B2]"
                    >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Reportar novedad</span>
                    </button>
                )}

                {/* Salto rápido a una ficha, solo si tiene más de una */}
                {esInstructor && fichas.length > 1 && (
                    <select
                        value=""
                        onChange={(e) => { if (e.target.value) navigate('/mis-fichas/' + e.target.value); }}
                        className="hidden rounded-lg border border-border bg-card px-2 py-1.5 text-sm font-medium text-foreground transition focus:outline-none focus:ring-2 focus:ring-primary/30 sm:block"
                        aria-label="Ir a una de mis fichas"
                    >
                        <option value="">Todas mis fichas</option>
                        {fichas.map((f) => (
                            <option key={f.id} value={f.id}>Ficha: {f.ficha}</option>
                        ))}
                    </select>
                )}

                <Link
                    to="/notificaciones"
                    className="relative cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                    aria-label={`Notificaciones${unreadNotifications > 0 ? `, ${unreadNotifications} sin leer` : ''}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </span>
                    )}
                </Link>

                <Link
                    to="/perfil"
                    className="group flex cursor-pointer items-center gap-3 rounded-lg border-l border-border p-1.5 pl-3 transition-colors hover:bg-muted sm:pl-4"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {initial}
                    </div>
                    <div className="hidden text-left sm:block">
                        <p className="max-w-[150px] truncate text-sm font-semibold text-foreground lg:max-w-[200px]">
                            {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">{rol}</p>
                    </div>
                </Link>
            </div>
        </header>
    );
}
