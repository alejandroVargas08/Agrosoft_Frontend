import { Link } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { InicioUsuario } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
  unreadNotifications: number;
}

export default function Header({ onMenuClick, unreadNotifications }: HeaderProps) {
  const { user } = InicioUsuario();
  const displayName = user?.nombre || user?.nombres || user?.name || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 right-0 left-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:left-20 lg:left-64 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
        aria-label="Abrir menú de navegación"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          to="/notificaciones"
          className="relative cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
          aria-label={`Notificaciones${
            unreadNotifications > 0 ? `, ${unreadNotifications} sin leer` : ''
          }`}
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </Link>

        <Link
          to="/perfil"
          className="group flex cursor-pointer items-center gap-3 rounded-lg border-l border-gray-200 p-1.5 pl-3 transition-colors hover:bg-gray-50 sm:pl-4"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 transition-colors group-hover:bg-emerald-200">
            {initial}
          </div>
          <div className="hidden text-left sm:block">
            <p className="max-w-[150px] truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-emerald-700 lg:max-w-[200px]">
              {displayName}
            </p>
            <p className="text-xs text-gray-500">Usuario</p>
          </div>
        </Link>
      </div>
    </header>
  );
}