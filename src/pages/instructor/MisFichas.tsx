import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, PageHeader, StatusBadge } from '../../components/ui/AgroUI';
import { useMisFichas } from '../../hooks/instructor/useMisFichas';
import type { FichaConResumen } from '../../hooks/instructor/useMisFichas';

const fecha = (valor: string) =>
    new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const Dato = ({ titulo, valor, alerta = false }: { titulo: string; valor: number; alerta?: boolean }) => (
    <div className="p-2 bg-muted rounded-lg text-center">
        <p className="text-muted-foreground">{titulo}</p>
        <p className={'font-bold ' + (alerta && valor > 0 ? 'text-[#F16C07]' : 'text-foreground')}>{valor}</p>
    </div>
);

const TarjetaFicha = ({ ficha, puedeRevisar }: { ficha: FichaConResumen; puedeRevisar: boolean }) => {
    const navigate = useNavigate();

    return (
        <Card>
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap size={20} className="text-primary" />
                </div>
                <StatusBadge status={ficha.estado} />
            </div>

            <p className="font-bold text-foreground text-lg font-mono">{ficha.ficha}</p>
            <p className="text-sm text-muted-foreground mb-2">{ficha.nombre}</p>
            <Badge color="info">{ficha.tipo}</Badge>

            <div className={'grid gap-2 mt-3 text-xs ' + (puedeRevisar ? 'grid-cols-2' : 'grid-cols-1')}>
                <Dato titulo="Aprendices" valor={ficha.aprendices} />
                {puedeRevisar && <Dato titulo="Por revisar" valor={ficha.porRevisar} alerta />}
            </div>

            <p className="text-xs text-muted-foreground mt-3 mb-3">
                {fecha(ficha.fechaInicio)} — {fecha(ficha.fechaFin)}
            </p>

            <Btn className="w-full justify-center" onClick={() => navigate('/mis-fichas/' + ficha.id)}>
                Ver ficha
            </Btn>
        </Card>
    );
};

const MisFichas = () => {
    const { fichas, total, cargando, error, puedeRevisar } = useMisFichas();

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fichas.map((ficha) => (
                            <TarjetaFicha key={ficha.id} ficha={ficha} puedeRevisar={puedeRevisar} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MisFichas;
