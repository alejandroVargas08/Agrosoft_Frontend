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
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-0 lg:left-64 md:left-20 z-20 flex items-center justify-between px-4 lg:px-8">
      
      <button 
        onClick={onMenuClick}
        className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <button 
          className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </button>
        
      
        <Link
          to="/perfil"
          className="flex items-center gap-3 pl-4 border-l border-gray-200 p-1.5 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm group-hover:bg-emerald-200 transition-colors shrink-0">
            {initial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors truncate max-w-[150px] lg:max-w-[200px]">
              {displayName}
            </p>
            <p className="text-xs text-gray-500">Usuario</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
