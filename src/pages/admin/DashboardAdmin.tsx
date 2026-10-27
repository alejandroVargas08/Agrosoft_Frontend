import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, DollarSign, GraduationCap, Settings, Shield, Sprout, UserCheck, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, StatCard } from '../../components/ui/AgroUI';
import { PaginaAdmin } from '../../components/admin/ComponentesAdmin';
import { insumosApi } from '../../api/inventario';
import { useDatosAdmin } from '../../hooks/admin/useDatosAdmin';
import { useInicio } from '../../hooks/Inicio/useInicio';
import { useReportes } from '../../hooks/useReportes';
import { ROL_APRENDIZ } from '../../types/admin/admin';

const pesos = (valor: number, compacto = false) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: compacto ? 1 : 0,
        notation: compacto ? 'compact' : 'standard',
    }).format(valor);

const ACCESOS = [
    { ruta: '/admin/usuarios', icono: Users, texto: 'Gestión Usuarios' },
    { ruta: '/admin/roles', icono: Shield, texto: 'Roles y Permisos' },
    { ruta: '/admin/programas', icono: GraduationCap, texto: 'Programas SENA' },
    { ruta: '/admin/configuracion', icono: Settings, texto: 'Config. Sistema' },
];

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const datos = useDatosAdmin();
    const inicio = useInicio();
    const { reporte } = useReportes();
    const bajoStock = useQuery({
        queryKey: ['insumos', 'bajo-stock'],
        queryFn: async () => (await insumosApi.listarBajoStock()).data,
    });

    const usuarios = datos.usuarios.data ?? [];
    const hoy = new Date();
    const nuevosMes = usuarios.filter((u) => {
        const f = new Date(u.creadoEn);
        return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    }).length;
    const pendientes = datos.solicitudes.data?.length ?? 0;
    const fichasActivas = (datos.fichas.data ?? []).filter((f) => f.estado === 'activo');
    const aprendices = datos.aprendices.filter((a) => a.estado === 'activo' && datos.esRol(a, ROL_APRENDIZ)).length;
    const desconectados = inicio.sensoresTotal - inicio.sensoresEnLinea;

    return (
        <PaginaAdmin>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Dashboard Administración</h1>
                <p className="text-sm text-muted-foreground mt-1">Vista general del sistema AgroSoft</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                <StatCard icon={Users} label="Usuarios" value={datos.usuarios.isLoading ? '…' : usuarios.length} sub={`${nuevosMes} nuevos este mes`} color="primary" />
                <StatCard icon={Sprout} label="Unidades Activas" value={inicio.cargandoResumen ? '…' : inicio.unidadesActivas} color="emerald" />
                <StatCard icon={DollarSign} label="Ingresos" value={inicio.cargandoResumen ? '…' : pesos(inicio.ventasDelMes, true)} sub="este mes" color="amber" />
                <StatCard icon={AlertTriangle} label="Alertas Activas" value={inicio.cargandoResumen ? '…' : inicio.incidenciasAbiertas} color="red" />
                <div onClick={() => navigate('/admin/solicitudes')} className="cursor-pointer">
                    <StatCard icon={UserCheck} label="Solicitudes pendientes" value={datos.solicitudes.isLoading ? '…' : pendientes} color={pendientes > 0 ? 'amber' : 'emerald'} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <Card>
                    <h3 className="font-semibold text-foreground mb-3">Ingresos vs Egresos</h3>
                    {reporte.finanzas.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">Aún no hay movimientos financieros</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={reporte.finanzas}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e6" />
                                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000000).toFixed(1)}M`} />
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
                        {ACCESOS.map(({ ruta, icono: Icono, texto }) => (
                            <button key={ruta} type="button" onClick={() => navigate(ruta)} className="flex items-center gap-2 p-3 bg-muted rounded-xl hover:bg-primary/10 transition text-left">
                                <Icono size={18} className="text-primary shrink-0" />
                                <span className="text-sm font-medium text-foreground">{texto}</span>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card>
                    <h3 className="font-semibold text-foreground mb-2 text-sm">Sensores</h3>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-primary">{inicio.sensoresEnLinea}/{inicio.sensoresTotal}</div>
                        <div>
                            <p className="text-xs text-muted-foreground">En línea</p>
                            <p className="text-xs text-red-500">{desconectados} desconectados</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <h3 className="font-semibold text-foreground mb-2 text-sm">Programas Activos</h3>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-primary">{fichasActivas.length}</div>
                        <div>
                            <p className="text-xs text-muted-foreground">Fichas activas</p>
                            <p className="text-xs text-muted-foreground">{aprendices} aprendices</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <h3 className="font-semibold text-foreground mb-2 text-sm">Inventario crítico</h3>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-red-500">{bajoStock.data?.length ?? 0}</div>
                        <div>
                            <p className="text-xs text-muted-foreground">Items bajo mínimo</p>
                            <button type="button" onClick={() => navigate('/inventario')} className="text-xs text-primary hover:underline">Ver inventario</button>
                        </div>
                    </div>
                </Card>
            </div>
        </PaginaAdmin>
    );
};

export default DashboardAdmin;
