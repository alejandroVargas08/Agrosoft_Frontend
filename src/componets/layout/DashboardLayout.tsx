import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import {InicioUsuario} from '../../hooks/useAuth'

interface DashboardLayoutProps {
  children: ReactNode;
  unreadNotifications?: number;
}

export default function DashboardLayout({ 
  children, 

  unreadNotifications = 0 
}: DashboardLayoutProps) {

    const {user} = InicioUsuario();

    const nombreInicio= user?.nombre ||user?.nombres || user?.name || 'Usuario';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 ml-64">
        
        <Header 
          userName={nombreInicio} 
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