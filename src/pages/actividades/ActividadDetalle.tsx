import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { TabEvidencias } from '../../components/actividadDetalle/TabEvidencias';
import { TabHerramientas } from '../../components/actividadDetalle/TabHerramientas';
import { TabUsos } from '../../components/actividadDetalle/TabUsos';
import { TabReservas } from '../../components/actividadDetalle/TabReservas';
import { TabInsumos } from '../../components/actividadDetalle/TabInsumos';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TabServicio } from '../../components/actividadDetalle/TabServicios';


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
    const actividadIdNum = actividadId ? Number(actividadId) : undefined;
    const navigate = useNavigate();

    const location = useLocation(); 
    const actividad = location.state?.actividad; 

    const [pestañaActiva, setPestañaActiva] = useState<PestañaId>('costos');
    const getEstadoBadge = (estado?: string) => {

        switch (estado) {
        case 'Completada': 
        case 'Finalizada':
            return 'bg-[#e2f4ed] text-[#0d5433]';

        case 'En_progreso':
            return 'bg-[#e8f0fe] text-[#1a73e8]';

        case 'Pendiente':
            return 'bg-[#fef3d6] text-[#b7791f]';
        default:
            return 'bg-[#e2f4ed] text-[#0d5433]';
    }
}
    return (
    <DashboardLayout>
        <div className="p-6 max-w-5xl mx-auto">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-start gap-3">
                    <button
                    onClick={() => navigate(-1)}
                    className="mt-1 p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
                    title="Regresar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                    </button>

                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                            { actividad ? `${actividad?.tipo} ${actividad?.subtipo ? `— ${actividad.subtipo}`: ''}` : `Actividad #${actividadId}`}
                        </h1>
                        <p className="text-sm text-neutral-400 mt-0.5">
                            { actividad?.fecha || 'Sin fecha registrada'}
                        </p>
                    </div>
                </div>

                <div className="self-start sm:self-auto">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getEstadoBadge(actividad?.estado)}`}>
                            {actividad?.estado ? actividad.estado.replace('_', ' ') : 'Cargando...'}
                        </span>
                </div>
            </div>

            <div className="flex gap-2 p-1.5 bg-[#f0f4f1] rounded-2xl mb-8 overflow-x-auto">
                    {PESTAÑAS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPestañaActiva(p.id)}
                            className={`flex-1 min-w-[120px] py-2.5 px-4 text-sm font-semibold rounded-xl transition-all ${
                                pestañaActiva === p.id
                                    ? 'bg-white text-neutral-900 shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/50'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
                {pestañaActiva === 'insumos' && <TabInsumos actividadId={actividadIdNum} />}
                {pestañaActiva === 'reservas' && <TabReservas actividadId={actividadIdNum} />}
                {pestañaActiva === 'usos' && <TabUsos actividadId={actividadIdNum} />}
                {pestañaActiva === 'herramientas' && <TabHerramientas actividadId={actividadIdNum} />}
                {pestañaActiva === 'servicios' && <TabServicio actividadId={actividadIdNum} />}
                {pestañaActiva === 'evidencias' && <TabEvidencias actividadId={actividadIdNum} />}
            </div>
        </div>
    </DashboardLayout>
    );
};

export default ActividadDetalle;