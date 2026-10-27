import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, PageHeader, SearchBar } from '../components/ui/AgroUI';

const PREGUNTAS = [
    {
        q: '¿Cómo registro una incidencia?',
        a: 'Entra a Incidencias y pulsa "Nueva incidencia". Completa el título, el tipo, la severidad y la unidad afectada. También puedes hacerlo desde Telegram con el comando /incidencia.',
    },
    {
        q: '¿Cómo funcionan las alertas?',
        a: 'Se generan solas: cuando un sensor sale de su rango operativo, cuando un insumo baja del stock mínimo, o cuando una actividad vence. El rango de cada sensor se edita desde Sensores IoT, abriendo el sensor.',
    },
    {
        q: '¿Qué significa cada calidad de cosecha?',
        a: 'Calidad A es producción premium para mercados selectivos, B es comercial estándar y C va a industria o transformación. La calidad se asigna al registrar el lote de producción.',
    },
    {
        q: '¿Cómo vinculo mi cuenta con Telegram?',
        a: 'En Configuración, sección Telegram, pulsa Vincular. AgroSoft genera un código de 10 minutos que envías al bot @AgroSoftSenaBot. Nunca escribas tu contraseña en el chat.',
    },
    {
        q: 'Cambiaron mis permisos y no veo las pantallas nuevas',
        a: 'El menú se arma al iniciar sesión y queda en caché. Cierra sesión y vuelve a entrar para que se actualice.',
    },
    {
        q: 'Soy aprendiz: ¿dónde reporto que falta un insumo?',
        a: 'Con el botón "Reportar novedad" de la barra superior, o entrando a Mis Novedades. Tu instructor la recibe en su bandeja y te responde ahí mismo.',
    },
    {
        q: '¿Por qué una tarea entregada tarde no aparece como vencida?',
        a: 'No son lo mismo. "Vencida" es que se pasó el plazo y sigue sin entregar. Si ya la entregaste, aparece como entregada, y se marca "tarde" si la entrega fue después de la fecha límite.',
    },
    {
        q: 'Olvidé mi contraseña',
        a: 'Usa "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión. Si el correo de tu cuenta no es real, pídele al administrador que te la restablezca desde Usuarios.',
    },
];

export default function CentroAyuda() {
    const navigate = useNavigate();
    const [busqueda, setBusqueda] = useState('');
    const [abierta, setAbierta] = useState<number | null>(0);

    const termino = busqueda.trim().toLowerCase();
    const visibles = termino
        ? PREGUNTAS.filter(
              (p) => p.q.toLowerCase().includes(termino) || p.a.toLowerCase().includes(termino),
          )
        : PREGUNTAS;

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6">
                <div className="mx-auto max-w-2xl space-y-4">
                    <PageHeader title="Centro de ayuda" onBack={() => navigate('/configuracion')} />

                    <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar en la ayuda..." />

                    {visibles.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            No hay nada con “{busqueda}”.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {visibles.map((p, i) => {
                                const activa = abierta === i;
                                return (
                                    <Card key={p.q} className="p-0">
                                        <button
                                            type="button"
                                            onClick={() => setAbierta(activa ? null : i)}
                                            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                                        >
                                            <span className="text-sm font-semibold text-foreground">{p.q}</span>
                                            <ChevronDown
                                                size={16}
                                                className={`shrink-0 text-muted-foreground transition-transform ${activa ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {activa && (
                                            <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                                                {p.a}
                                            </p>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    <Card>
                        <h2 className="mb-1 text-sm font-semibold text-foreground">¿No encontraste tu caso?</h2>
                        <p className="text-sm text-muted-foreground">
                            Escríbele al instructor a cargo de tu ficha, o al administrador del sistema desde
                            el centro de formación.
                        </p>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
