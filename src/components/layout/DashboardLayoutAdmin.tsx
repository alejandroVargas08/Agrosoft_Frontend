import { useState, type ReactNode } from 'react';
import SidebarAdmin from './SidebarAdmin';
import HeaderAdmin from './HeaderAdmin';
import ChatBotFlotante from '../Chatbot/ChatBotFlotante';
import { useNotificacionesContext } from '../../context/NotificacionesContext';

interface DashboardLayoutAdminProps {
  children: ReactNode;
  mostrarChatFlotante?: boolean;
}

export default function DashboardLayoutAdmin({
  children,
  mostrarChatFlotante = true,
}: DashboardLayoutAdminProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sinLeer } = useNotificacionesContext();

  return (
    <div className="min-h-screen bg-[#F9FAF7] flex">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 ml-0 md:ml-20 lg:ml-64 flex flex-col min-h-screen">
        <HeaderAdmin
          onMenuClick={() => setSidebarOpen(true)}
          unreadNotifications={sinLeer}
        />

        <main className="flex-1 pt-16 pb-24 sm:pb-8">{children}</main>
        {mostrarChatFlotante && <ChatBotFlotante />}
      </div>
    </div>
  );
}
