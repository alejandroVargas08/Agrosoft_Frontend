import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, PageHeader } from '../components/ui/AgroUI';

const PUNTOS = [
    'Los datos personales no se comparten con terceros sin autorización explícita.',
    'Puedes pedir la eliminación de tus datos al administrador del sistema.',
    'El acceso exige autenticación; la contraseña se guarda cifrada y nunca viaja en claro.',
    'Si vinculas Telegram, AgroSoft solo guarda el identificador de tu chat, tu nombre y tu correo.',
    'La vinculación con Telegram usa un código temporal: tu contraseña no se escribe en el chat.',
    'Puedes desvincular Telegram cuando quieras desde Configuración, o con /salir en el bot.',
];

export default function Privacidad() {
    const navigate = useNavigate();

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6">
                <div className="mx-auto max-w-2xl space-y-4">
                    <PageHeader
                        title="Política de privacidad"
                        onBack={() => navigate('/configuracion')}
                    />

                    <Card>
                        <p className="font-semibold text-foreground">AgroSoft — Tratamiento de datos</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Centro de Gestión y Desarrollo Sostenible Surcolombiano · SENA, Pitalito (Huila)
                        </p>

                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            AgroSoft es un sistema de gestión agrícola desarrollado por aprendices del SENA para
                            las unidades productivas del centro. La información que se registra tiene un uso
                            exclusivamente académico y productivo, y se trata bajo los lineamientos de la{' '}
                            <span className="font-medium text-foreground">
                                Ley 1581 de 2012
                            </span>{' '}
                            de protección de datos personales de Colombia.
                        </p>

                        <ul className="mt-4 space-y-2">
                            {PUNTOS.map((punto) => (
                                <li key={punto} className="flex gap-2 text-sm text-muted-foreground">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                    <span>{punto}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card>
                        <h2 className="mb-2 text-sm font-semibold text-foreground">Qué datos se guardan</h2>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li>· Identificación, nombre, correo y teléfono de la cuenta.</li>
                            <li>· La ficha y el programa de formación al que perteneces.</li>
                            <li>· Lo que registras en el sistema: actividades, incidencias, cosechas, ventas.</li>
                            <li>· La fecha del último ingreso, para el seguimiento del instructor.</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
