import { useState, useEffect } from 'react';
import DashboardLayout from '../componets/layout/DashboardLayout';

export default function Inicio() {
  const [nombreUsuario, setNombreUsuario] = useState('');

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('nombreUsuario') || 'Cristian'; 
    setNombreUsuario(usuarioGuardado);
  }, []);

  return (
    <DashboardLayout unreadNotifications={2}>
      <h1 className="text-2xl font-bold text-gray-900">
        Buenos días, {nombreUsuario} 🖕🏻
      </h1>
      <p className="text-gray-500 mt-1">
        Trabaje tumbakatre
      </p>
    </DashboardLayout>
  );
}