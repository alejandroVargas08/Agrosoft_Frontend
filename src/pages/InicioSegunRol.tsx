import DashboardLayout from '../components/layout/DashboardLayout';
import { usePermisos } from '../hooks/permisos/usePermisos';
import Inicio from './inicio';
import InicioInstructor from './instructor/InicioInstructor';
import InicioAprendiz from './aprendiz/InicioAprendiz';

const GESTIONAR_USUARIOS = 'usuarios.gestionar';
const ASIGNAR_ACTIVIDADES = 'actividades.asignar';
const EJECUTAR_ACTIVIDADES = 'actividades.ejecutar';

/**
 * El Inicio se bifurca por rol, como en el diseño: el administrador ve el
 * resumen general, el instructor su panel y el aprendiz sus tareas del día.
 */
const InicioSegunRol = () => {
    const { puede, cargando } = usePermisos();

    // Sin esto se alcanza a pintar el Inicio del administrador y luego cambia
    if (cargando) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <p className="text-sm text-muted-foreground">Cargando tu inicio...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (puede(GESTIONAR_USUARIOS)) return <Inicio />;
    if (puede(ASIGNAR_ACTIVIDADES)) return <InicioInstructor />;
    if (puede(EJECUTAR_ACTIVIDADES)) return <InicioAprendiz />;
    return <Inicio />;
};

export default InicioSegunRol;
