import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferenciasNotificacionApi, type PreferenciasNotificacion } from '../api/preferenciasNotificacion';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, HelpCircle, Shield, LogOut, ChevronRight, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Badge, Btn, Card, Modal, PageHeader } from '../components/ui/AgroUI';
import { useTelegram } from '../hooks/useTelegram';
import { usePerfil } from '../hooks/usePerfil';

const BOT = 'ArGros_bot';

// Las del diseño. Se guardan en el backend y deciden qué avisos le llegan a
// cada quien, en la campana de la app y en Telegram si lo vinculó.
const NOTIFICACIONES: { clave: keyof PreferenciasNotificacion; label: string }[] = [
    { clave: 'alertasSensores', label: 'Alertas de sensores' },
    { clave: 'stockBajo', label: 'Stock bajo' },
    { clave: 'actividadesVencidas', label: 'Actividades vencidas' },
    { clave: 'nuevasIncidencias', label: 'Nuevas incidencias' },
];

function Switch({ checked, onChange, disabled = false }: {
    checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            } ${checked ? 'bg-primary' : 'bg-muted'}`}
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

    const { perfil, cambiarDosPasos } = usePerfil();
    const [guardandoDosPasos, setGuardandoDosPasos] = useState(false);
    const [errorDosPasos, setErrorDosPasos] = useState<string | null>(null);

    const alternarDosPasos = async (activo: boolean) => {
        setErrorDosPasos(null);
        setGuardandoDosPasos(true);
        try {
            await cambiarDosPasos(activo);
        } catch {
            setErrorDosPasos('No se pudo guardar el cambio. Intenta de nuevo.');
        } finally {
            setGuardandoDosPasos(false);
        }
    };

    const [modalAbierto, setModalAbierto] = useState(false);
    const [codigo, setCodigo] = useState<string | null>(null);
    const [expiraEn, setExpiraEn] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const preferenciasQuery = useQuery({
        queryKey: ['preferencias-notificacion'],
        queryFn: async () => (await preferenciasNotificacionApi.obtener()).data,
    });
    const preferencias = preferenciasQuery.data;

    // Se guarda al tocar el interruptor; si falla, vuelve a como estaba
    const guardarPreferencia = useMutation({
        mutationFn: (cambio: Partial<PreferenciasNotificacion>) => preferenciasNotificacionApi.guardar(cambio),
        onMutate: async (cambio) => {
            await queryClient.cancelQueries({ queryKey: ['preferencias-notificacion'] });
            const antes = queryClient.getQueryData<PreferenciasNotificacion>(['preferencias-notificacion']);
            if (antes) queryClient.setQueryData(['preferencias-notificacion'], { ...antes, ...cambio });
            return { antes };
        },
        onError: (_e, _c, contexto) => {
            if (contexto?.antes) queryClient.setQueryData(['preferencias-notificacion'], contexto.antes);
        },
        onSuccess: (respuesta) => queryClient.setQueryData(['preferencias-notificacion'], respuesta.data),
    });

    const cambiarPreferencia = (clave: keyof PreferenciasNotificacion, valor: boolean) =>
        guardarPreferencia.mutate({ [clave]: valor });

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
                {/* Centrado: el titulo y las tarjetas comparten el mismo ancho
                    para que queden alineados entre si. */}
                <div className="mx-auto w-full max-w-2xl space-y-4">
                    <PageHeader title="Configuración" />

                    <Card>
                        <h3 className="mb-3 font-semibold text-foreground">Privacidad y Seguridad</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3 border-b border-border py-2">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Verificación en dos pasos</p>
                                    <p className="text-xs text-muted-foreground">
                                        {errorDosPasos
                                            ? errorDosPasos
                                            : perfil?.dosPasosActivo
                                              ? 'Al iniciar sesión te pediremos un código enviado a tu correo'
                                              : 'Código por correo al iniciar sesión'}
                                    </p>
                                </div>
                                <Switch
                                    checked={perfil?.dosPasosActivo ?? false}
                                    disabled={!perfil || guardandoDosPasos}
                                    onChange={alternarDosPasos}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3 py-2">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Vincular con Telegram</p>
                                    <p className="text-xs text-muted-foreground">
                                        {cargandoEstado
                                            ? 'Consultando…'
                                            : !disponible
                                              ? 'El bot no está activo en este servidor'
                                              : vinculado
                                                ? 'Cuenta vinculada'
                                                : 'Recibe notificaciones en Telegram'}
                                    </p>
                                </div>

                                {cargandoEstado ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : !disponible ? (
                                    <Badge color="muted">No disponible</Badge>
                                ) : vinculado ? (
                                    <Btn
                                        variant="outline"
                                        size="sm"
                                        disabled={desvincular.isPending}
                                        onClick={() => desvincular.mutate()}
                                    >
                                        <MessageCircle size={14} />
                                        {desvincular.isPending ? 'Desconectando…' : 'Desconectar'}
                                    </Btn>
                                ) : (
                                    <Btn variant="outline" size="sm" onClick={abrirModal}>
                                        <MessageCircle size={14} />Vincular
                                    </Btn>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="mb-3 font-semibold text-foreground">Notificaciones</h3>
                        <div className="space-y-3">
                            {NOTIFICACIONES.map((n) => (
                                <div key={n.clave} className="flex items-center justify-between gap-4 py-1">
                                    <span className="text-sm text-foreground">{n.label}</span>
                                    <Switch
                                        checked={preferencias?.[n.clave] ?? true}
                                        onChange={(v) => cambiarPreferencia(n.clave, v)}
                                        disabled={!preferencias}
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="mb-3 font-semibold text-foreground">Cuenta</h3>
                        <div className="space-y-2">
                            {[
                                { icono: HelpCircle, label: 'Centro de ayuda', ruta: '/ayuda' },
                                { icono: Shield, label: 'Política de privacidad', ruta: '/privacidad' },
                            ].map(({ icono: Icono, label, ruta }) => (
                                <button
                                    key={ruta}
                                    type="button"
                                    onClick={() => navigate(ruta)}
                                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                                >
                                    <Icono size={16} className="text-muted-foreground" />
                                    <span className="text-sm text-foreground">{label}</span>
                                    <ChevronRight size={14} className="ml-auto text-muted-foreground" />
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    navigate('/login');
                                }}
                                className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-red-600 transition-colors hover:bg-red-50"
                            >
                                <LogOut size={16} />
                                <span className="text-sm font-medium">Cerrar sesión</span>
                            </button>
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
