import { useNavigate } from 'react-router-dom';
import { AlertTriangle, DollarSign, GraduationCap, Settings, Shield, Sprout, UserCheck, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, StatCard } from '../../components/ui/AgroUI';
import { useDashboardAdmin } from '../../hooks/admin/useDashboardAdmin';

const pesos = (valor: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);

const ACCESOS = [
    { ruta: '/usuarios', icon: Users, label: 'Gestión Usuarios' },
    { ruta: '/roles', icon: Shield, label: 'Roles y Permisos' },
    { ruta: '/programas', icon: GraduationCap, label: 'Programas SENA' },
    { ruta: '/ajustes', icon: Settings, label: 'Config. Sistema' },
];

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const d = useDashboardAdmin();

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Dashboard Administración</h1>
                    <p className="text-sm text-muted-foreground mt-1">Vista general del sistema AgroSoft</p>
                </div>

                {d.error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {d.error}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    <StatCard
                        icon={Users}
                        label="Usuarios"
                        value={d.usuarios}
                        sub={d.usuarios === '—' ? undefined : `${d.nuevosEsteMes} ${d.nuevosEsteMes === 1 ? 'nuevo' : 'nuevos'} este mes`}
                        color="primary"
                    />
                    <StatCard icon={Sprout} label="Unidades Activas" value={d.unidadesActivas} color="emerald" />
                    <StatCard
                        icon={DollarSign}
                        label="Ingresos"
                        value={d.ingresosMes === null ? '—' : pesos(d.ingresosMes)}
                        sub="este mes"
                        color="amber"
                    />
                    <StatCard icon={AlertTriangle} label="Alertas Activas" value={d.alertasActivas} color="red" />
                    <div onClick={() => navigate('/solicitudes')} className="cursor-pointer">
                        <StatCard
                            icon={UserCheck}
                            label="Solicitudes pendientes"
                            value={d.pendientes}
                            color={d.pendientes > 0 ? 'amber' : 'emerald'}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Ingresos vs Egresos</h3>
                        {d.cargandoFinanzas || d.finanzas.length === 0 ? (
                            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                                {d.cargandoFinanzas ? 'Cargando...' : 'Sin movimientos financieros registrados.'}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={d.finanzas}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e6" />
                                    <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                    <Tooltip formatter={(v) => pesos(Number(v))} />
                                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#2d7a3e" fill="#2d7a3e20" />
                                    <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#dc2626" fill="#dc262620" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Accesos rápidos Admin</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {ACCESOS.map((a) => (
                                <button
                                    key={a.ruta}
                                    type="button"
                                    onClick={() => navigate(a.ruta)}
                                    className="flex items-center gap-2 p-3 bg-muted rounded-xl hover:bg-primary/10 transition text-left"
                                >
                                    <a.icon size={18} className="text-primary shrink-0" />
                                    <span className="text-sm font-medium text-foreground">{a.label}</span>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-2 text-sm">Sensores</h3>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-primary">
                                {d.sensores.listo ? `${d.sensores.conectados}/${d.sensores.total}` : '—'}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">En línea</p>
                                {d.sensores.listo && <p className="text-xs text-red-500">{d.sensores.desconectados} desconectados</p>}
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="font-semibold text-foreground mb-2 text-sm">Programas Activos</h3>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-primary">
                                {d.programas.listo ? d.programas.fichasActivas : '—'}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Fichas activas</p>
                                {d.programas.listo && <p className="text-xs text-muted-foreground">{d.programas.aprendices} aprendices</p>}
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="font-semibold text-foreground mb-2 text-sm">Inventario crítico</h3>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-bold text-red-500">{d.inventarioCritico}</div>
                            <div>
                                <p className="text-xs text-muted-foreground">Items bajo mínimo</p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/inventario')}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Ver inventario
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DashboardAdmin;
