import { DollarSign, Scale, Sprout, TrendingUp } from 'lucide-react';
import {
    Area, AreaChart, Bar, BarChart as ReBarChart, CartesianGrid, Cell,
    Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, StatCard } from '../components/ui/AgroUI';
import { useReportes } from '../hooks/useReportes';
import type { PeriodoReporte } from '../types/reportes';

// Se asigna un color a cada cultivo según el orden en que llega del backend
const COLORES = ['#2d7a3e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

const PERIODOS: { label: string; valor: PeriodoReporte }[] = [
    { label: 'Mensual', valor: 'mensual' },
    { label: 'Trimestral', valor: 'trimestral' },
    { label: 'Anual', valor: 'anual' },
];

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

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Reportes</h1>
                        <p className="text-sm text-muted-foreground">Análisis y estadísticas</p>
                    </div>
                    <div className="flex gap-2">
                        {PERIODOS.map((p) => (
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
            </div>
        </DashboardLayout>
    );
};

export default Reportes;