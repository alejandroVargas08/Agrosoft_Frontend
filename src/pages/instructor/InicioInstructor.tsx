import { useNavigate } from 'react-router-dom';
import { ClipboardList, GraduationCap, Package, Radio, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, StatCard } from '../../components/ui/AgroUI';
import { useInicioInstructor } from '../../hooks/instructor/useInicioInstructor';
import { InicioUsuario } from '../../hooks/useAuth';

const hoy = () =>
    new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

const saludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
};

const fechaCorta = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—';

const InicioInstructor = () => {
    const navigate = useNavigate();
    const { user } = InicioUsuario();
    const {
        fichas, aprendices, porRevisar, insumosBajos, sensoresConAlerta,
        ultimasEntregas, puedeRevisar, cargando,
    } = useInicioInstructor();

    const nombreSesion = user?.nombre ?? user?.nombres ?? user?.name ?? '';
    const primerNombre = nombreSesion.split(' ')[0];

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">
                        {saludo()}{primerNombre ? ', ' + primerNombre : ''}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{hoy()}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    <button type="button" onClick={() => navigate('/mis-fichas')} className="text-left cursor-pointer">
                        <StatCard icon={GraduationCap} label="Mis fichas" value={fichas} color="primary" />
                    </button>

                    <StatCard icon={Users} label="Aprendices" value={aprendices} color="blue" />

                    {puedeRevisar && (
                        <button type="button" onClick={() => navigate('/por-revisar')} className="text-left cursor-pointer">
                            <StatCard
                                icon={ClipboardList}
                                label="Por revisar"
                                value={porRevisar}
                                color={porRevisar > 0 ? 'amber' : 'emerald'}
                            />
                        </button>
                    )}

                    <button type="button" onClick={() => navigate('/inventario')} className="text-left cursor-pointer">
                        <StatCard
                            icon={Package}
                            label="Insumos bajos"
                            value={insumosBajos}
                            color={insumosBajos > 0 ? 'red' : 'emerald'}
                        />
                    </button>

                    <button type="button" onClick={() => navigate('/alertas')} className="text-left cursor-pointer">
                        <StatCard
                            icon={Radio}
                            label="Sensores en alerta"
                            value={sensoresConAlerta}
                            color={sensoresConAlerta > 0 ? 'red' : 'emerald'}
                        />
                    </button>
                </div>

                {puedeRevisar && (
                    <Card>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <ClipboardList size={16} className="text-primary" />
                                Últimas entregas
                            </h3>
                            {porRevisar > ultimasEntregas.length && (
                                <Btn variant="ghost" size="sm" onClick={() => navigate('/por-revisar')}>
                                    Ver todas ({porRevisar})
                                </Btn>
                            )}
                        </div>

                        {cargando ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
                        ) : ultimasEntregas.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No hay entregas esperando revisión.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {ultimasEntregas.map((entrega) => (
                                    <button
                                        key={entrega.id}
                                        type="button"
                                        onClick={() => navigate('/por-revisar')}
                                        className="w-full flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl text-left hover:shadow-sm transition"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {entrega.aprendiz
                                                    ? entrega.aprendiz.nombre + ' ' + entrega.aprendiz.apellido
                                                    : 'Aprendiz'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {entrega.actividad?.nombre ?? 'Actividad'}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-muted-foreground">
                                                {fechaCorta(entrega.entregadaEn)}
                                            </p>
                                            <p className="text-xs font-bold text-primary">
                                                {entrega.horasTrabajadas !== null ? entrega.horasTrabajadas + 'h' : ''}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default InicioInstructor;
