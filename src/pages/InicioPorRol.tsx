import Inicio from './inicio';
import DashboardAdmin from './admin/DashboardAdmin';
import { useEsAdmin } from '../hooks/admin/useDatosAdmin';

const InicioPorRol = () => {
    const { esAdmin, cargando } = useEsAdmin();
    if (cargando && !esAdmin) return <div className="min-h-screen bg-[#F9FAF7]" />;
    return esAdmin ? <DashboardAdmin /> : <Inicio />;
};

export default InicioPorRol;
