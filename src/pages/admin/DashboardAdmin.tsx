import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BookMarked, Clock, GraduationCap, UserCheck, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, PageHeader, StatCard } from '../../components/ui/AgroUI';
import { useDashboardAdmin } from '../../hooks/admin/useDashboardAdmin';

const fecha = (valor: string) =>
    new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const { totales, porRol, pendientes, fichasSinInstructor, nombreRol, cargando, error } =
        useDashboardAdmin();

    const maximo = Math.max(1, ...porRol.map((f) => f.total));

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader title="Administración" subtitle="Usuarios, fichas y solicitudes" />

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    <button type="button" onClick={() => navigate('/usuarios')} className="text-left cursor-pointer">
                        <StatCard icon={Users} label="Usuarios" value={totales.usuarios} color="primary" />
                    </button>
                    <StatCard icon={UserCheck} label="Activos" value={totales.activos} color="emerald" />
                    <button type="button" onClick={() => navigate('/solicitudes')} className="text-left cursor-pointer">
                        <StatCard
                            icon={Clock}
                            label="Pendientes"
                            value={totales.pendientes}
                            color={totales.pendientes > 0 ? 'amber' : 'emerald'}
                        />
                    </button>
                    <button type="button" onClick={() => navigate('/programas')} className="text-left cursor-pointer">
                        <StatCard icon={BookMarked} label="Fichas activas" value={totales.fichasActivas} color="blue" />
                    </button>
                    <StatCard icon={GraduationCap} label="Aprendices" value={totales.aprendices} color="primary" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Users size={16} className="text-primary" />
                            Usuarios por rol
                        </h3>

                        {cargando ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
                        ) : porRol.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Todavía no hay usuarios registrados.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {porRol.map((fila) => (
                                    <div key={fila.rol}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="font-medium text-foreground">{fila.rol}</span>
                                            <span className="text-muted-foreground">{fila.total}</span>
                                        </div>
                                        <div className="bg-muted rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-primary transition-all"
                                                style={{ width: (fila.total / maximo) * 100 + '%' }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-2 border-t border-border flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span>Rechazados: {totales.rechazados}</span>
                                    <span>Inactivos o suspendidos: {totales.inactivos}</span>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                Solicitudes por resolver
                            </h3>
                            {totales.pendientes > pendientes.length && (
                                <Btn variant="ghost" size="sm" onClick={() => navigate('/solicitudes')}>
                                    Ver todas ({totales.pendientes})
                                </Btn>
                            )}
                        </div>

                        {cargando ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
                        ) : pendientes.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No hay solicitudes esperando aprobación.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {pendientes.map((u) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => navigate('/solicitudes')}
                                        className="w-full flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl text-left hover:shadow-sm transition"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {u.nombre} {u.apellido}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                Pidió {u.solicitud?.rolSolicitado ?? nombreRol(u.rolId)}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0">{fecha(u.creadoEn)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {fichasSinInstructor.length > 0 && (
                    <Card className="mt-4">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-[#F16C07]" />
                            Fichas activas sin instructor
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            Sin instructor a cargo, nadie puede asignarles tareas ni revisar sus entregas.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {fichasSinInstructor.map((p) => (
                                <button key={p.id} type="button" onClick={() => navigate('/programas')}>
                                    <Badge color="warning">
                                        {p.ficha} · {p.nombre}
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default DashboardAdmin;
