import { useState } from 'react';
import { CheckCircle2, ClipboardList, Clock, DollarSign, Scale, Sprout, TrendingUp, Users } from 'lucide-react';
import {
    Area, AreaChart, Bar, BarChart as ReBarChart, CartesianGrid, Cell,
    Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, EmptyState, StatCard, StatusBadge, Tab } from '../components/ui/AgroUI';
import { usePermisos } from '../hooks/permisos/usePermisos';
import { useReporteAprendices } from '../hooks/useReporteAprendices';
import { useReportes } from '../hooks/useReportes';
import type { PeriodoReporte } from '../types/reportes';

// Se asigna un color a cada cultivo según el orden en que llega del backend
const COLORES = ['#2d7a3e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

const PERIODOS: { label: string; valor: PeriodoReporte }[] = [
    { label: 'Mensual', valor: 'mensual' },
    { label: 'Trimestral', valor: 'trimestral' },
    { label: 'Anual', valor: 'anual' },
];

const GESTIONAR_USUARIOS = 'usuarios.gestionar';
const ASIGNAR_ACTIVIDADES = 'actividades.asignar';

const BOTON_BASE = 'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ';
const BOTON_ACTIVO = 'bg-primary text-white';
const BOTON_INACTIVO = 'bg-muted text-muted-foreground';

const fmtPesos = (valor: number) =>
    '$ ' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0);

const fmtKg = (valor: number) =>
    new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor || 0) + ' kg';

const SinDatos = ({ altura = 220 }: { altura?: number }) => (
    <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height: altura }}
    >
        Sin datos en este período
    </div>
);

const Reportes = () => {
    const { periodo, setPeriodo, reporte, cargando, error } = useReportes();
    const { resumen, cultivos, produccion, distribucion, finanzas } = reporte;
    const { puede } = usePermisos();

    // Las pestañas dependen del rol, como en el diseño
    const esAdmin = puede(GESTIONAR_USUARIOS);
    const verAprendices = esAdmin || puede(ASIGNAR_ACTIVIDADES);
    const pestanas = ['Producción', ...(esAdmin ? ['Finanzas'] : []), ...(verAprendices ? ['Aprendices'] : [])];

    const [pestana, setPestana] = useState('Producción');
    const activa = pestanas.includes(pestana) ? pestana : 'Producción';

    const alumnos = useReporteAprendices(verAprendices && activa === 'Aprendices');

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Reportes</h1>
                        <p className="text-sm text-muted-foreground">Análisis y estadísticas</p>
                    </div>
                    <div className="flex gap-2">
                        {activa !== 'Aprendices' && PERIODOS.map((p) => (
                            <button
                                key={p.valor}
                                onClick={() => setPeriodo(p.valor)}
                                className={BOTON_BASE + (periodo === p.valor ? BOTON_ACTIVO : BOTON_INACTIVO)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                        {error}
                    </div>
                )}

                {pestanas.length > 1 && (
                    <Tab tabs={pestanas} active={activa} onChange={setPestana} />
                )}

                {activa === 'Producción' && <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <StatCard icon={Scale} label="Producción total" value={fmtKg(resumen.produccionTotalKg)} color="emerald" />
                    <StatCard icon={DollarSign} label="Ingresos" value={fmtPesos(resumen.ingresos)} color="primary" />
                    <StatCard icon={TrendingUp} label="Rentabilidad" value={resumen.rentabilidad + '%'} color="amber" />
                    <StatCard icon={Sprout} label="Unidades activas" value={resumen.unidadesActivas} color="blue" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Producción por cultivo (kg)</h3>
                        {cargando || produccion.length === 0 ? (
                            <SinDatos />
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <ReBarChart data={produccion}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e6" />
                                    <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    {cultivos.map((cultivo, i) => (
                                        <Bar
                                            key={cultivo}
                                            dataKey={cultivo}
                                            name={cultivo}
                                            fill={COLORES[i % COLORES.length]}
                                            radius={[3, 3, 0, 0]}
                                        />
                                    ))}
                                </ReBarChart>
                            </ResponsiveContainer>
                        )}
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Distribución producción</h3>
                        {cargando || distribucion.length === 0 ? (
                            <SinDatos />
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={distribucion}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                        labelLine={false}
                                        label={(d) => d.name + ' ' + ((d.percent ?? 0) * 100).toFixed(0) + '%'}
                                    >
                                        {distribucion.map((entrada, i) => (
                                            <Cell key={entrada.name} fill={COLORES[i % COLORES.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => fmtKg(Number(v))} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </Card>
                </div>
                </>}

                {activa === 'Finanzas' && (
                <Card>
                    <h3 className="font-semibold text-foreground mb-3">Finanzas: Ingresos vs Egresos</h3>
                    {cargando || finanzas.length === 0 ? (
                        <SinDatos altura={180} />
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={finanzas}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e6" />
                                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 1000000).toFixed(1) + 'M'} />
                                <Tooltip formatter={(v) => fmtPesos(Number(v))} />
                                <Legend />
                                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#2d7a3e" fill="#2d7a3e20" />
                                <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#dc2626" fill="#dc262620" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Card>
                )}

                {activa === 'Aprendices' && <>
                    {alumnos.error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                            {alumnos.error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <StatCard icon={Users} label="Aprendices" value={alumnos.totales.aprendices} color="primary" />
                        <StatCard icon={ClipboardList} label="Tareas asignadas" value={alumnos.totales.tareas} color="blue" />
                        <StatCard icon={CheckCircle2} label="Tareas aprobadas" value={alumnos.totales.aprobadas} color="emerald" />
                        <StatCard
                            icon={Clock} label="Horas acumuladas" value={alumnos.totales.horas + 'h'} color="amber"
                            sub={fmtPesos(alumnos.totales.costoHoras) + ' de mano de obra'}
                        />
                    </div>

                    {alumnos.cargando ? (
                        <Card><SinDatos altura={160} /></Card>
                    ) : alumnos.aprendices.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="Sin aprendices a cargo"
                            description="Cuando tengas fichas asignadas, aquí aparece el desempeño de cada aprendiz."
                        />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card>
                                <h3 className="font-semibold text-foreground mb-3">Desempeño por aprendiz</h3>
                                <div className="space-y-3">
                                    {alumnos.aprendices.map((a) => (
                                        <div key={a.id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 grid place-items-center text-primary font-bold text-sm">
                                                {a.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between text-xs mb-1 gap-2">
                                                    <span className="font-semibold text-foreground truncate">{a.nombreCompleto}</span>
                                                    <span className="text-muted-foreground shrink-0">
                                                        {a.idFicha ? 'Ficha ' + a.idFicha : 'Sin ficha'}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: a.avance + '%' }} />
                                                </div>
                                                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-0.5">
                                                    <span>{a.aprobadas} de {a.tareas} aprobadas</span>
                                                    <span>{a.horas}h trabajadas</span>
                                                    {a.vencidas > 0 && <span className="font-semibold text-red-600">{a.vencidas} vencida{a.vencidas === 1 ? '' : 's'}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card>
                                <h3 className="font-semibold text-foreground mb-3">Estado de las tareas</h3>
                                <div className="space-y-2">
                                    {alumnos.aprendices.map((a) => (
                                        <div key={a.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{a.nombreCompleto}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {a.entregadas} por revisar · {a.tareas - a.aprobadas - a.entregadas} en curso
                                                </p>
                                            </div>
                                            {a.vencidas > 0
                                                ? <StatusBadge status="overdue" />
                                                : a.entregadas > 0
                                                    ? <StatusBadge status="delivered" />
                                                    : <StatusBadge status="approved" />}
                                            <span className="text-xs font-semibold text-primary shrink-0">{a.horas}h</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {alumnos.aprendices.length > 0 && (
                        <Card className="mt-4">
                            <h3 className="font-semibold text-foreground mb-3">Costo por horas trabajadas</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-xs text-muted-foreground">
                                            <th className="text-left py-2 pr-4 font-semibold">Aprendiz</th>
                                            <th className="text-center py-2 px-2 font-semibold">Tareas</th>
                                            <th className="text-center py-2 px-2 font-semibold">Horas</th>
                                            <th className="text-right py-2 pl-2 font-semibold">Costo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alumnos.aprendices.map((a) => (
                                            <tr key={a.id} className="border-b border-border last:border-0">
                                                <td className="py-2 pr-4 font-medium text-foreground">{a.nombreCompleto}</td>
                                                <td className="py-2 px-2 text-center text-muted-foreground">{a.aprobadas} de {a.tareas}</td>
                                                <td className="py-2 px-2 text-center">{a.horas}h</td>
                                                <td className="py-2 pl-2 text-right font-semibold text-primary">{fmtPesos(a.costoHoras)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/50">
                                            <td className="py-2 pr-4 font-bold">Total</td>
                                            <td className="py-2 px-2 text-center font-bold">{alumnos.totales.aprobadas} de {alumnos.totales.tareas}</td>
                                            <td className="py-2 px-2 text-center font-bold">{alumnos.totales.horas}h</td>
                                            <td className="py-2 pl-2 text-right font-bold text-primary">{fmtPesos(alumnos.totales.costoHoras)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Cada actividad tiene su propio precio por hora, así que el costo se suma por tarea y no
                                con una tarifa única. Solo cuentan las actividades que puedes ver.
                            </p>
                        </Card>
                    )}
                </>}
            </div>
        </DashboardLayout>
    );
};

export default Reportes;