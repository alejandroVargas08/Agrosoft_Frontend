import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  unreadNotifications?: number;
}

export default function DashboardLayout({ 
  children, 
  unreadNotifications = 0 
}: DashboardLayoutProps) {

    const [SidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
      isOpen={SidebarOpen}
      onClose={() => setSidebarOpen (false)}
      />

      <div className="flex-1 ml-64">
        
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          unreadNotifications={unreadNotifications} 
        />

        {/*Aqui trabajar*/}
        <main className="pt-20 px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}