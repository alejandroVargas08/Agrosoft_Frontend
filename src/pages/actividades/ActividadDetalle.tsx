import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { TabEvidencias } from '../../components/actividadDetalle/TabEvidencias';
import { TabHerramientas } from '../../components/actividadDetalle/TabHerramientas';
import { TabUsos } from '../../components/actividadDetalle/TabUsos';
import { TabReservas } from '../../components/actividadDetalle/TabReservas';
import { TabInsumos } from '../../components/actividadDetalle/TabInsumos';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TabServicio } from '../../components/actividadDetalle/TabServicios';

const PESTAÑAS = [
    { id: 'insumos', label: 'Insumos' },
    { id: 'reservas', label: 'Reservas' },
    { id: 'usos', label: 'Usos' },
    { id: 'herramientas', label: 'Herramientas' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'evidencias', label: 'Evidencias' },
] as const;

type PestañaId = (typeof PESTAÑAS)[number]['id'];

const ActividadDetalle = () => {
    const { actividadId } = useParams<{ actividadId: string }>();
    const actividadIdNum = actividadId ? Number(actividadId) : undefined;
    const [pestañaActiva, setPestañaActiva] = useState<PestañaId>('insumos');

    return (
    <DashboardLayout>
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-neutral-900 mb-1">Actividad #{actividadId}</h1>
            <p className="text-neutral-500 mb-6">Detalle, insumos y recursos usados</p>

            <div className="flex gap-1 mb-6 border-b border-neutral-200 overflow-x-auto">
            {PESTAÑAS.map((p) => (
                <button
                key={p.id}
                onClick={() => setPestañaActiva(p.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                    pestañaActiva === p.id
                    ? 'border-green-700 text-green-800'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
                >
                {p.label}
                </button>
            ))}
            </div>

        {pestañaActiva === 'insumos' && <TabInsumos actividadId={actividadIdNum} />}
        {pestañaActiva === 'reservas' && <TabReservas actividadId={actividadIdNum} />}
        {pestañaActiva === 'usos' && <TabUsos actividadId={actividadIdNum} />}
        {pestañaActiva === 'herramientas' && <TabHerramientas actividadId={actividadIdNum} />}
        {pestañaActiva === 'servicios' && <TabServicio actividadId={actividadIdNum} />}
        {pestañaActiva === 'evidencias' && <TabEvidencias actividadId={actividadIdNum} />}
        </div>
    </DashboardLayout>
    );
};

export default ActividadDetalle;