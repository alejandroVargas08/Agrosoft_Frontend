import {Bell, ChevronDown} from 'lucide-react'

interface HeaderProps{
    userName: string;
    unreadNotifications: number;
}

export default function Header({
    userName,
    unreadNotifications
}: HeaderProps){
    return(
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10 flex items-center justify-between px-8">
      <div className="flex items-center gap-2 text-gray-500">
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <span className="block w-5 h-0.5 bg-gray-600 mb-1"></span>
          <span className="block w-5 h-0.5 bg-gray-600 mb-1"></span>
          <span className="block w-5 h-0.5 bg-gray-600"></span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            {userName.charAt(0)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">Usuario</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}