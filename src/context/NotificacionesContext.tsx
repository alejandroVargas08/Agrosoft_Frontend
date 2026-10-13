import { createContext, useContext, type ReactNode } from 'react';
import { useNotificaciones } from '../hooks/notificaciones/useNotificaciones';

type NotificacionesValue = ReturnType<typeof useNotificaciones>;

const NotificacionesContext = createContext<NotificacionesValue | null>(null);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const value = useNotificaciones();
  return (
    <NotificacionesContext.Provider value={value}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificacionesContext() {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) {
    throw new Error('useNotificacionesContext debe usarse dentro de NotificacionesProvider');
  }
  return ctx;
}