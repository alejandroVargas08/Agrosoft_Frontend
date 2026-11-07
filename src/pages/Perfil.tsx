import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Award, BookOpen, Calendar, CheckCircle, GraduationCap, Hash,
    Mail, MapPin, Pencil, Phone,
} from 'lucide-react';
import logoAgrosoft from '../assets/img/logo-agrosoft.png';
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

/** Una fila de ficha: ícono, etiqueta y valor. La usan las dos tarjetas. */
const Dato = ({ icono: Icono, etiqueta, valor }: {
    icono: typeof Mail; etiqueta: string; valor: ReactNode;
}) => (
    <div className="flex items-center gap-3 border-b border-border py-2 last:border-0">
        <Icono size={14} className="shrink-0 text-muted-foreground" />
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{etiqueta}</p>
            {typeof valor === 'string'
                ? <p className="break-words font-medium text-foreground">{valor}</p>
                : <div className="mt-0.5">{valor}</div>}
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
                {/* La columna ocupa todo el alto: la tarjeta queda arriba con su
                    tamaño y el logo se centra en lo que sobra. */}
                <div className="flex flex-col gap-4 lg:col-span-1">
                <Card className="shrink-0 text-center">
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

                {/* El Figma deja este espacio vacio, pero con dos tarjetas a la
                    derecha queda un hueco grande: va el logo para cerrarlo.
                    En movil las tarjetas se apilan y no sobra nada, asi que
                    alli no se muestra. */}
                    <div className="hidden flex-1 flex-col items-center justify-center gap-3 py-6 opacity-40 lg:flex">
                        <img src={logoAgrosoft} alt="" className="w-full max-w-[220px] rounded-3xl object-cover" />
                        <div className="text-center">
                            <p className="text-xl font-bold text-muted-foreground">AgroSoft</p>
                            <p className="text-sm uppercase tracking-widest text-muted-foreground">SENA</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Información personal</h3>
                        <div className="text-sm">
                            <Dato icono={Mail} etiqueta="Correo" valor={correo || 'No registrado'} />
                            <Dato icono={Phone} etiqueta="Teléfono" valor={telefono || 'No registrado'} />
                            <Dato icono={MapPin} etiqueta="Ubicación" valor={ubicacion || 'No registrada'} />
                        </div>
                    </Card>

                    <Card>
                        <div className="mb-3 flex items-center gap-2">
                            <GraduationCap size={18} className="text-primary" />
                            <h3 className="font-semibold text-foreground">Programa de Formación SENA</h3>
                        </div>

                        {programaFormacion ? (
                            <div className="text-sm">
                                <Dato icono={BookOpen} etiqueta="Programa" valor={programaFormacion.nombre} />
                                <Dato icono={Award} etiqueta="Tipo" valor={programaFormacion.tipo} />
                                <Dato icono={Hash} etiqueta="Ficha" valor={programaFormacion.ficha} />
                                <Dato
                                    icono={Calendar}
                                    etiqueta="Vigencia"
                                    valor={fecha(programaFormacion.fechaInicio) + ' — ' + fecha(programaFormacion.fechaFin)}
                                />
                                <Dato
                                    icono={Activity}
                                    etiqueta="Estado"
                                    valor={<StatusBadge status={programaFormacion.estado} />}
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Aún no tienes un programa de formación registrado.
                            </p>
                        )}
                    </Card>
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
