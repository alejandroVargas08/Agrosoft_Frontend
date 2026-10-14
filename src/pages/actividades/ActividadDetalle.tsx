import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { TabEvidencias } from '../../components/actividadDetalle/TabEvidencias';
import { TabHerramientas } from '../../components/actividadDetalle/TabHerramientas';
import { TabUsos } from '../../components/actividadDetalle/TabUsos';
import { TabReservas } from '../../components/actividadDetalle/TabReservas';
import { TabInsumos } from '../../components/actividadDetalle/TabInsumos';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TabServicio } from '../../components/actividadDetalle/TabServicios';
import { Badge, Card, PageHeader, StatusBadge, Tab } from '../../components/ui/AgroUI';
import { estadoParaBadge } from '../../utils/estadoActividad';


const PESTAÑAS = [
    { id: 'costos', label: 'costos'},
    { id: 'insumos', label: 'Insumos' },
    { id: 'herramientas', label: 'Herramientas' },
    { id: 'historial', label: 'historial'},
    { id: 'reservas', label: 'Reservas' },
    { id: 'usos', label: 'Usos' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'evidencias', label: 'Evidencias' },
] as const;

type PestañaId = (typeof PESTAÑAS)[number]['id'];

const ActividadDetalle = () => {
    const { actividadId } = useParams<{ actividadId: string }>();
    const location = useLocation();
    const actividad = location.state?.actividad;
    const actividadIdNum = actividadId ? Number(actividadId) : undefined;
    const navigate = useNavigate();

    const [pestañaActiva, setPestañaActiva] = useState<PestañaId>('costos');

    return (
    <DashboardLayout>
        <div className="p-6 max-w-5xl mx-auto">

            <PageHeader
                title={actividad ? `${actividad?.tipo} ${actividad?.subtipo ? `— ${actividad.subtipo}`: ''}` : `Actividad #${actividadId}`}
                subtitle={actividad?.fecha || 'Sin fecha registrada'}
                onBack={() => navigate(-1)}
                action={
                    actividad?.estado
                        ? <StatusBadge status={estadoParaBadge(actividad.estado)} />
                        : <Badge color="muted">Cargando...</Badge>
                }
            />

            <Tab
                tabs={PESTAÑAS.map((p) => p.label)}
                active={PESTAÑAS.find((p) => p.id === pestañaActiva)?.label ?? ''}
                onChange={(label) => {
                    const pestaña = PESTAÑAS.find((p) => p.label === label);
                    if (pestaña) setPestañaActiva(pestaña.id);
                }}
            />

            <Card>
                {pestañaActiva === 'insumos' && <TabInsumos actividadId={actividadIdNum} />}
                {pestañaActiva === 'reservas' && <TabReservas actividadId={actividadIdNum} />}
                {pestañaActiva === 'usos' && <TabUsos actividadId={actividadIdNum} />}
                {pestañaActiva === 'herramientas' && <TabHerramientas actividadId={actividadIdNum} />}
                {pestañaActiva === 'servicios' && <TabServicio actividadId={actividadIdNum} />}
                {pestañaActiva === 'evidencias' && <TabEvidencias actividadId={actividadIdNum} />}
            </Card>
        </div>
    </DashboardLayout>
    );
};

export default ActividadDetalle;