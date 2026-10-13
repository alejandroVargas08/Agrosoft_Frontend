import { Outlet } from 'react-router-dom';
import { NotificacionesProvider } from '../../context/NotificacionesContext';

export default function LayoutConNotificaciones() {
  return (
    <NotificacionesProvider>
      <Outlet />
    </NotificacionesProvider>
  );
}