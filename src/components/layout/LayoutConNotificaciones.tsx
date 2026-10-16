import { Outlet } from 'react-router-dom';
import { NotificacionesProvider } from '../../context/NotificacionesContext';
import AvisoNotificaciones from '../Notificacion/AvisoNotificaciones';

export default function LayoutConNotificaciones() {
  return (
    <NotificacionesProvider>
      <Outlet />
      <AvisoNotificaciones />
    </NotificacionesProvider>
  );
}