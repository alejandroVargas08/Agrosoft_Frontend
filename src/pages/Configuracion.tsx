import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, HelpCircle, ShieldCheck, LogOut, ChevronRight, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Btn, Card, Modal, PageHeader } from '../components/ui/AgroUI';
import { useTelegram } from '../hooks/useTelegram';

const BOT = 'AgroSoftSenaBot';

// Estas solo valen en este navegador: no hay tabla de preferencias todavia
const NOTIFICACIONES = [
    { clave: 'notifTareas', label: 'Tareas asignadas y devueltas' },
    { clave: 'notifSolicitudes', label: 'Solicitudes de acceso' },
] as const;

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                checked ? 'bg-primary' : 'bg-muted'
            }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

export default function Configuracion() {
    const navigate = useNavigate();
    const { disponible, vinculado, cargandoEstado, refrescarEstado, generarCodigo, desvincular } =
        useTelegram();

    const [modalAbierto, setModalAbierto] = useState(false);
    const [codigo, setCodigo] = useState<string | null>(null);
    const [expiraEn, setExpiraEn] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [preferencias, setPreferencias] = useState<Record<string, boolean>>({});

    useEffect(() => {
        try {
            setPreferencias(JSON.parse(localStorage.getItem('agrosoft_notificaciones') ?? '{}'));
        } catch {
            setPreferencias({});
        }
    }, []);

    const cambiarPreferencia = (clave: string, valor: boolean) => {
        const siguiente = { ...preferencias, [clave]: valor };
        setPreferencias(siguiente);
        try {
            localStorage.setItem('agrosoft_notificaciones', JSON.stringify(siguiente));
        } catch {
            // Modo privado: la preferencia simplemente no se recuerda
        }
    };

    const pedirCodigo = async () => {
        setError(null);
        try {
            const datos = await generarCodigo.mutateAsync();
            setCodigo(datos.codigo);
            setExpiraEn(datos.expiraEn);
        } catch {
            setError('No se pudo generar el código. Intenta de nuevo.');
        }
    };

    const abrirModal = async () => {
        setCodigo(null);
        setModalAbierto(true);
        await pedirCodigo();
    };

    const irATelegram = () => {
        if (!codigo) return;
        // El bot recibe el codigo como payload de /start y lo canjea
        window.open(`https://t.me/${BOT}?start=${codigo}`, '_blank', 'noopener');
    };

    const minutosRestantes = expiraEn
        ? Math.max(0, Math.round((new Date(expiraEn).getTime() - Date.now()) / 60_000))
        : null;

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6">
                <div className="mx-auto max-w-3xl space-y-6">
                    <PageHeader title="Configuración" />

                    <Card>
                        <h2 className="mb-1 font-semibold text-foreground">Telegram</h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Vincula tu cuenta para registrar incidencias y pedir reportes desde el chat.
                        </p>

                        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    Estado de la vinculación
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {cargandoEstado
                                        ? 'Consultando…'
                                        : !disponible
                                          ? 'El bot no está activo en este servidor'
                                          : vinculado
                                            ? 'Tu cuenta está vinculada al bot'
                                            : 'Sin vincular'}
                                </p>
                            </div>

                            {cargandoEstado ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : !disponible ? (
                                <Badge color="muted">No disponible</Badge>
                            ) : vinculado ? (
                                <div className="flex items-center gap-3">
                                    <Badge color="success">Vinculada</Badge>
                                    <Btn
                                        variant="outline"
                                        size="sm"
                                        disabled={desvincular.isPending}
                                        onClick={() => desvincular.mutate()}
                                    >
                                        {desvincular.isPending ? 'Desconectando…' : 'Desconectar'}
                                    </Btn>
                                </div>
                            ) : (
                                <Btn variant="outline" size="sm" onClick={abrirModal}>
                                    <Send size={14} />
                                    Vincular
                                </Btn>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="mb-1 font-semibold text-foreground">Notificaciones</h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Qué avisos quieres ver en la campana. Hoy se guardan solo en este navegador.
                        </p>
                        <div className="space-y-3 border-t border-border pt-4">
                            {NOTIFICACIONES.map((n) => (
                                <div key={n.clave} className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-foreground">{n.label}</span>
                                    <Switch
                                        checked={preferencias[n.clave] ?? true}
                                        onChange={(v) => cambiarPreferencia(n.clave, v)}
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="mb-3 font-semibold text-foreground">Cuenta</h2>
                        <div className="divide-y divide-border">
                            {[
                                { icono: HelpCircle, label: 'Centro de ayuda', ruta: '/ayuda' },
                                { icono: ShieldCheck, label: 'Política de privacidad', ruta: '/privacidad' },
                            ].map(({ icono: Icono, label, ruta }) => (
                                <button
                                    key={ruta}
                                    type="button"
                                    onClick={() => navigate(ruta)}
                                    className="group -mx-2 flex w-full items-center justify-between rounded-lg px-2 py-3.5 text-left transition-colors hover:bg-muted"
                                >
                                    <span className="flex items-center gap-3">
                                        <Icono size={18} className="text-muted-foreground" />
                                        <span className="text-sm font-medium text-foreground">{label}</span>
                                    </span>
                                    <ChevronRight size={16} className="text-muted-foreground" />
                                </button>
                            ))}

                            <div className="pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        navigate('/login');
                                    }}
                                    className="-mx-2 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                >
                                    <LogOut size={16} />
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Vincular Telegram">
                <div className="space-y-5 text-center">
                    <p className="text-sm text-muted-foreground">
                        Abre el bot <span className="font-semibold text-foreground">@{BOT}</span> y envíale
                        este código. No tienes que escribir tu contraseña en el chat.
                    </p>

                    <div className="relative rounded-xl bg-muted px-6 py-4">
                        {generarCodigo.isPending || !codigo ? (
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                        ) : (
                            <>
                                <span className="block text-3xl font-bold tracking-widest text-primary">
                                    {codigo}
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    {minutosRestantes !== null
                                        ? `Expira en ${minutosRestantes} minuto${minutosRestantes === 1 ? '' : 's'}`
                                        : 'Expira en 10 minutos'}
                                </span>
                                <button
                                    type="button"
                                    onClick={pedirCodigo}
                                    title="Generar otro código"
                                    className="absolute right-3 top-3 p-1 text-muted-foreground transition-colors hover:text-primary"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="space-y-2">
                        <Btn onClick={irATelegram} disabled={!codigo} className="w-full justify-center">
                            <ExternalLink size={16} />
                            Abrir Telegram
                        </Btn>
                        <Btn
                            variant="outline"
                            className="w-full justify-center"
                            onClick={() => {
                                refrescarEstado();
                                setModalAbierto(false);
                            }}
                        >
                            Ya lo envié, comprobar
                        </Btn>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Pedir un código nuevo anula el anterior.
                    </p>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
