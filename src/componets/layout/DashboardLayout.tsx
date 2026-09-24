import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState } from 'react';
import ChatBotFlotante from '../Chatbot/ChatBotFlotante';

interface DashboardLayoutProps {
  children: ReactNode;
  unreadNotifications?: number;
  mostrarChatFlotante?: boolean;
}

export default function DashboardLayout({
  children,
  unreadNotifications = 0,
  mostrarChatFlotante = true
}: DashboardLayoutProps) {

  const [SidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAF7] flex">
      <Sidebar
        isOpen={SidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 ml-0 md:ml-20 lg:ml-64 flex flex-col min-h-screen">
        
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          unreadNotifications={unreadNotifications}
        />

        <main className="flex-1 pt-16 pb-24 sm:pb-8">
          {children}
        </main>
        
        {mostrarChatFlotante && <ChatBotFlotante />}

      </div>
    </div>
  );
}
