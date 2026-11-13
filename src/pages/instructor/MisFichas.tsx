import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, PageHeader, StatusBadge } from '../../components/ui/AgroUI';
import { useMisFichas } from '../../hooks/instructor/useMisFichas';
import type { FichaConResumen } from '../../hooks/instructor/useMisFichas';

const fecha = (valor: string) =>
    new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const Dato = ({ titulo, valor, color = '' }: { titulo: string; valor: number; color?: string }) => (
    <div className="p-2 bg-muted rounded-lg text-center">
        <p className="text-muted-foreground">{titulo}</p>
        <p className={'font-bold ' + (color && valor > 0 ? color : 'text-foreground')}>{valor}</p>
    </div>
);

const TarjetaFicha = ({ ficha }: { ficha: FichaConResumen }) => {
    const navigate = useNavigate();

    return (
        <Card>
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-icon-bg rounded-lg">
                    <GraduationCap size={20} className="text-primary" />
                </div>
                <StatusBadge status={ficha.estado} />
            </div>

            <p className="font-bold text-foreground text-lg font-mono">{ficha.ficha}</p>
            <p className="text-sm text-muted-foreground mb-1">{ficha.nombre}</p>
            <Badge color="info">{ficha.tipo}</Badge>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <Dato titulo="Aprendices" valor={ficha.aprendices} />
                <Dato titulo="Tareas activas" valor={ficha.tareasActivas} />
                <Dato titulo="Por revisar" valor={ficha.porRevisar} color="text-[#F16C07]" />
                <Dato titulo="Novedades" valor={ficha.novedades} color="text-red-600" />
            </div>

            <div className="text-xs text-muted-foreground mt-2 mb-3">
                <p>{fecha(ficha.fechaInicio)} — {fecha(ficha.fechaFin)}</p>
            </div>

            <Btn className="w-full justify-center" onClick={() => navigate('/mis-fichas/' + ficha.id)}>
                Ver ficha
            </Btn>
        </Card>
    );
};

const MisFichas = () => {
    const { fichas, total, cargando, error } = useMisFichas();

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Mis fichas"
                    subtitle={total === 1 ? '1 ficha a tu cargo' : total + ' fichas a tu cargo'}
                />

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando tus fichas...</p>
                ) : total === 0 ? (
                    <EmptyState
                        icon={GraduationCap}
                        title="Sin fichas asignadas"
                        description="Cuando el administrador te asigne fichas, aparecerán aquí."
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fichas.map((ficha) => (
                            <TarjetaFicha key={ficha.id} ficha={ficha} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MisFichas;
