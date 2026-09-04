import DashboardLayout from '../componets/layout/DashboardLayout';

export default function Inicio() {
  return (
    <DashboardLayout unreadNotifications={1}>
      {/* contenido del dashboard */}
      <h1 className="text-2xl font-bold text-gray-900">
        Buenos días
      </h1>
      <p className="text-gray-500 mt-1">
        Trabajen chamos
      </p>

      {/* Trabajen aqui*/}
    </DashboardLayout>
  );
}