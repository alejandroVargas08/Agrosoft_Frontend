import ChatBotFlotante from '../componets/Chatbot/ChatBotFlotante';
import DashboardLayout from '../componets/layout/DashboardLayout';
import { InicioUsuario } from '../hooks/useAuth';
import { useEffect, useState } from 'react';

export default function Inicio() {

  const { user } = InicioUsuario();
  const displayName = user?.nombre || user?.nombres || user?.name || 'Usuario';
  const primerNombre = displayName.split(' ')[0];
  const nombreFormateado = primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1);

  const [saludo, setSaludo] = useState('');
  useEffect(() => {
    const actualizarSaludo = () => {
      const h = new Date().getHours();
      if (h >= 6 && h < 12) setSaludo('Buenos días');
      else if (h >= 12 && h < 19) setSaludo('Buenas tardes');
      else setSaludo('Buenas noches');
    };
    actualizarSaludo();
    const intervalo = setInterval(actualizarSaludo, 60000);
    return () => clearInterval(intervalo);
  }, []);

  const [fechaHoy, setFeachaHoy] = useState('');
  useEffect(()=> {
    const actulizarFecha = () => {
      setFeachaHoy(
        new Date().toLocaleDateString('es-ES',{
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );
    };
    actulizarFecha();

    const intervalo = setInterval(actulizarFecha, 60000 );

    return () => clearInterval(intervalo);

  }, []);

  return (
    <DashboardLayout unreadNotifications={2}>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
        {saludo}, {nombreFormateado} 😈😏
      </h1>
      <p className="text-sm sm:text-base text-gray-500 mt-1 capitalize">
        Resumen de hoy - {fechaHoy}
      </p>

      <ChatBotFlotante/>
    </DashboardLayout>
  );
}