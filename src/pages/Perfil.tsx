import { useNavigate } from 'react-router-dom';
import { CheckCircle, GraduationCap, Mail, MapPin, Pencil, Phone } from 'lucide-react';
import { usePerfil } from '../hooks/usePerfil';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Btn, Card, PageHeader, StatusBadge } from '../components/ui/AgroUI';

const fecha = (valor?: string) => {
    if (!valor) return 'No registrada';
    const d = new Date(valor);
    if (isNaN(d.getTime())) return valor;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const inicial = (nombre?: string) => nombre?.trim()?.charAt(0)?.toUpperCase() ?? 'U';

/** Una fila de la ficha personal: ícono, etiqueta y valor */
const Dato = ({ icono: Icono, etiqueta, valor }: {
    icono: typeof Mail; etiqueta: string; valor: string;
}) => (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
        <Icono size={14} className="text-muted-foreground shrink-0" />
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{etiqueta}</p>
            <p className="font-medium text-foreground break-words">{valor}</p>
        </div>
    </div>
);

export default function Perfil() {
    const navigate = useNavigate();
    const { perfil, cargando, error } = usePerfil();

    const contenido = () => {
        if (cargando) return <p className="text-sm text-muted-foreground">Cargando tu perfil...</p>;

        if (error) {
            return (
                <div className="max-w-xl p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                    {error}
                </div>
            );
        }

        if (!perfil) {
            return (
                <div className="max-w-xl p-3 bg-[#FFF3E0] border border-[#F16C07]/30 rounded-xl text-sm text-[#E65100] font-medium">
                    Tu perfil no fue encontrado.
                </div>
            );
        }

        const { nombre, apellido, correo, telefono, ubicacion, rol, correoVerificado, programaFormacion } = perfil;
        const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ') || 'Sin nombre';

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-1 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-3xl font-bold text-primary">
                        {inicial(nombre)}
                    </div>
                    <h2 className="font-bold text-foreground">{nombreCompleto}</h2>
                    <p className="text-sm text-muted-foreground break-words">{correo || 'Correo no registrado'}</p>
                    <div className="mt-2"><Badge color="primary">{rol || 'Usuario'}</Badge></div>
                    {correoVerificado && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-emerald-600">
                            <CheckCircle size={12} />Correo verificado
                        </div>
                    )}
                </Card>

                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Información personal</h3>
                        <div className="space-y-2 text-sm">
                            <Dato icono={Mail} etiqueta="Correo" valor={correo || 'No registrado'} />
                            <Dato icono={Phone} etiqueta="Teléfono" valor={telefono || 'No registrado'} />
                            <Dato icono={MapPin} etiqueta="Ubicación" valor={ubicacion || 'No registrada'} />
                        </div>
                    </Card>

                    {programaFormacion ? (
                        <Card className="border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-2 mb-3">
                                <GraduationCap size={18} className="text-primary" />
                                <h3 className="font-semibold text-foreground">Programa de Formación SENA</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground shrink-0">Programa</span>
                                    <span className="font-medium text-right">{programaFormacion.nombre}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">Tipo</span>
                                    <span className="font-medium">{programaFormacion.tipo}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">Ficha</span>
                                    <span className="font-mono font-bold text-primary">{programaFormacion.ficha}</span>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground shrink-0">Vigencia</span>
                                    <span className="font-medium text-right">
                                        {fecha(programaFormacion.fechaInicio)} — {fecha(programaFormacion.fechaFin)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-muted-foreground">Estado</span>
                                    <StatusBadge status={programaFormacion.estado} />
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="border-primary/20 bg-primary/5">
                            <p className="text-sm text-muted-foreground">
                                Aún no tienes un programa de formación registrado.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Mi Perfil"
                    action={
                        <Btn variant="outline" size="sm" onClick={() => navigate('/editar-perfil')}>
                            <Pencil size={14} />Editar
                        </Btn>
                    }
                />
                {contenido()}
            </div>
        </DashboardLayout>
    );
}
