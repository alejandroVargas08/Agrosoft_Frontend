import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Clock, GraduationCap, MapPin, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, PageHeader, SearchBar, StatCard, StatusBadge, Tab } from '../../components/ui/AgroUI';
import { useFichaDetalle } from '../../hooks/instructor/useFichaDetalle';

const PESTANAS = ['Aprendices', 'Lotes'];

const fecha = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Nunca';

const COLUMNAS = ['Aprendiz', 'Documento', 'Tareas', 'Aprobadas', 'Por revisar', 'Vencidas', 'Horas', 'Último ingreso', ''];

const FichaDetalle = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const fichaId = Number(id);
    const [pestana, setPestana] = useState(PESTANAS[0]);

    const {
        ficha, aprendices, totales, lotes, busqueda, setBusqueda,
        cargando, error, fichaNoEncontrada,
    } = useFichaDetalle(fichaId);

    if (fichaNoEncontrada) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <EmptyState
                        icon={GraduationCap}
                        title="Ficha no encontrada"
                        description="No existe, o no está entre las fichas a tu cargo."
                        action={<Btn variant="outline" onClick={() => navigate('/mis-fichas')}>Volver a mis fichas</Btn>}
                    />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title={ficha ? 'Ficha ' + ficha.ficha : 'Ficha'}
                    subtitle={ficha?.nombre}
                    onBack={() => navigate('/mis-fichas')}
                />

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <StatCard icon={Users} label="Aprendices" value={totales.aprendices} color="primary" />
                    <StatCard
                        icon={Clock}
                        label="Por revisar"
                        value={totales.porRevisar}
                        color={totales.porRevisar > 0 ? 'amber' : 'emerald'}
                    />
                    <StatCard
                        icon={AlertTriangle}
                        label="Vencidas"
                        value={totales.vencidas}
                        color={totales.vencidas > 0 ? 'red' : 'emerald'}
                    />
                    <StatCard icon={Clock} label="Horas del grupo" value={totales.horas + 'h'} color="blue" />
                </div>

                <Tab tabs={PESTANAS} active={pestana} onChange={setPestana} />

                {pestana === 'Aprendices' && (
                    <div>
                        <div className="mb-3">
                            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar aprendiz..." />
                        </div>

                        {cargando ? (
                            <p className="py-16 text-center text-sm text-muted-foreground">Cargando aprendices...</p>
                        ) : aprendices.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                title={totales.aprendices === 0 ? 'Sin aprendices' : 'Nadie con esa búsqueda'}
                                description={
                                    totales.aprendices === 0
                                        ? 'Cuando se registren aprendices con esta ficha, aparecerán aquí.'
                                        : 'Prueba con otro nombre, correo o documento.'
                                }
                            />
                        ) : (
                            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[800px]">
                                        <thead>
                                            <tr className="bg-muted border-b border-border">
                                                {COLUMNAS.map((col) => (
                                                    <th
                                                        key={col}
                                                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aprendices.map((a, i) => (
                                                <tr
                                                    key={a.id}
                                                    className={
                                                        'border-b border-border last:border-0 hover:bg-muted/20 ' +
                                                        (i % 2 === 0 ? 'bg-white' : 'bg-muted/10')
                                                    }
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                                {a.nombre.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium truncate">
                                                                    {a.nombre} {a.apellido}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">{a.correo}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.identificacion}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-center">{a.tareas}</td>
                                                    <td className="px-4 py-3 text-sm text-center font-bold text-primary">{a.aprobadas}</td>
                                                    <td className="px-4 py-3 text-sm text-center">
                                                        <span className={a.entregadas > 0 ? 'text-[#F16C07] font-bold' : 'text-muted-foreground'}>
                                                            {a.entregadas}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center">
                                                        <span className={a.vencidas > 0 ? 'text-red-600 font-bold' : 'text-muted-foreground'}>
                                                            {a.vencidas}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-center">{a.horas}h</td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                        {fecha(a.ultimoIngreso)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Btn variant="outline" size="sm" onClick={() => navigate('/aprendices/' + a.id)}>
                                                            Ver
                                                        </Btn>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {pestana === 'Lotes' && (
                    lotes.length === 0 ? (
                        <EmptyState
                            icon={MapPin}
                            title="Sin lotes asignados a la ficha"
                            description="Un lote pertenece a una ficha por su programa de formación. Los que no tienen ficha los ve todo el mundo y no salen aquí."
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {lotes.map((lote) => (
                                <Card key={lote.id}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <MapPin size={16} className="text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate">{lote.nombre}</p>
                                            <p className="text-xs text-muted-foreground">{lote.areaHa} ha</p>
                                        </div>
                                    </div>
                                    {lote.descripcion && (
                                        <p className="text-xs text-muted-foreground mb-2">{lote.descripcion}</p>
                                    )}
                                    <StatusBadge status={lote.estado} />
                                </Card>
                            ))}
                        </div>
                    )
                )}

                {ficha && (
                    <p className="mt-6 text-xs text-muted-foreground">
                        <Badge color="info">{ficha.tipo}</Badge>{' '}
                        {fecha(ficha.fechaInicio)} — {fecha(ficha.fechaFin)}
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
};

export default FichaDetalle;
