import { useEffect, useState, type ElementType, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Copy, Info, MoreVertical, ShieldAlert } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import { Badge, Btn, EmptyState, Input, Modal, Select } from '../ui/AgroUI';
import { usuariosAdminApi } from '../../api/admin/admin';
import { mensajeError } from '../../api/errores/errores';
import { useEsAdmin, useRefrescarAdmin, type DatosAdmin } from '../../hooks/admin/useDatosAdmin';
import { ROL_ADMIN, ROL_INSTRUCTOR, type UsuarioAdmin } from '../../types/admin/admin';
import { ESTADO_USUARIO, nombreCompleto } from '../../utils/admin/admin';

export const Inicial = ({ nombre, tamano = 'md' }: { nombre: string; tamano?: 'sm' | 'md' }) => (
    <div className={`${tamano === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10'} rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0`}>
        {nombre.charAt(0).toUpperCase()}
    </div>
);

/**
 * Avatar y MenuAcciones los importaba Fichas.tsx pero no existian en ninguna
 * parte del repo, asi que el build de main no pasaba. Se escriben aqui sobre
 * lo que ya habia: Avatar reusa Inicial, y MenuAcciones es el desplegable de
 * acciones por tarjeta.
 */
export const Avatar = ({ persona, tamano = 'md' }: {
    persona: { nombre: string; apellido: string } | null | undefined;
    tamano?: 'sm' | 'md';
}) => <Inicial nombre={nombreCompleto(persona) || '?'} tamano={tamano} />;

export interface AccionMenu {
    label: string;
    icon?: ElementType;
    onClick: () => void;
    peligro?: boolean;
}

export const MenuAcciones = ({ acciones }: { acciones: AccionMenu[] }) => {
    const [abierto, setAbierto] = useState(false);

    // Un clic fuera cierra el menu
    useEffect(() => {
        if (!abierto) return;
        const cerrar = () => setAbierto(false);
        window.addEventListener('click', cerrar);
        return () => window.removeEventListener('click', cerrar);
    }, [abierto]);

    return (
        <div className="relative shrink-0">
            <button
                type="button"
                aria-label="Acciones"
                onClick={(e) => { e.stopPropagation(); setAbierto((v) => !v); }}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
            >
                <MoreVertical size={16} />
            </button>

            {abierto && (
                <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                    {acciones.map((a) => {
                        const Icono = a.icon;
                        return (
                            <button
                                key={a.label}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setAbierto(false); a.onClick(); }}
                                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                                    a.peligro ? 'text-red-600' : 'text-foreground'
                                }`}
                            >
                                {Icono && <Icono size={14} />}
                                {a.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const EstadoUsuarioBadge = ({ estado }: { estado: UsuarioAdmin['estado'] }) => {
    const info = ESTADO_USUARIO[estado] ?? { texto: estado, color: 'muted' as const };
    return <Badge color={info.color}>{info.texto}</Badge>;
};

export const RolBadge = ({ nombre }: { nombre: string }) => {
    const color = nombre === ROL_ADMIN ? 'danger' : nombre === ROL_INSTRUCTOR ? 'primary' : 'success';
    return <Badge color={color}>{nombre}</Badge>;
};

export const Aviso = ({ tipo = 'info', children }: { tipo?: 'info' | 'error' | 'exito' | 'alerta'; children: ReactNode }) => {
    const estilos: Record<string, { clase: string; icono: ElementType }> = {
        info: { clase: 'bg-blue-50 border-blue-200 text-blue-800', icono: Info },
        error: { clase: 'bg-red-50 border-red-200 text-red-700', icono: AlertTriangle },
        exito: { clase: 'bg-emerald-50 border-emerald-200 text-emerald-800', icono: CheckCircle2 },
        alerta: { clase: 'bg-[#FFF3E0] border-amber-200 text-[#E65100]', icono: Info },
    };
    const { clase, icono: Icono } = estilos[tipo];
    return (
        <div className={`flex items-start gap-2 p-3 border rounded-xl text-sm ${clase}`}>
            <Icono size={14} className="shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
};

export const PaginaAdmin = ({ children }: { children: ReactNode }) => {
    const { esAdmin, cargando } = useEsAdmin();
    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {cargando && !esAdmin ? (
                    <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
                ) : esAdmin ? (
                    children
                ) : (
                    <EmptyState icon={ShieldAlert} title="Solo para administradores" description="Esta sección es para el administrador de AgroSoft." />
                )}
            </div>
        </DashboardLayout>
    );
};

export const BotonesModal = ({ textoConfirmar, onConfirmar, onCancelar, cargando = false, deshabilitado = false, peligro = false }: {
    textoConfirmar: string; onConfirmar: () => void; onCancelar: () => void; cargando?: boolean; deshabilitado?: boolean; peligro?: boolean;
}) => (
    <div className="flex gap-3 pt-1">
        <Btn variant={peligro ? 'danger' : 'primary'} className="flex-1 justify-center" onClick={onConfirmar} disabled={cargando || deshabilitado}>
            {cargando ? 'Procesando...' : textoConfirmar}
        </Btn>
        <Btn variant="outline" onClick={onCancelar}>Cancelar</Btn>
    </div>
);

export const ModalAprobar = ({ usuario, datos, onClose }: { usuario: UsuarioAdmin | null; datos: DatosAdmin; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const solicitud = usuario?.solicitud;
    const esInstructor = solicitud?.rolSolicitado === ROL_INSTRUCTOR;
    const [fichas, setFichas] = useState<number[]>([]);
    useEffect(() => setFichas(usuario?.solicitud?.fichasACargo ?? []), [usuario]);

    const aprobar = useMutation({
        mutationFn: async () => {
            await usuariosAdminApi.aprobar(usuario!.id);
            if (!esInstructor) return;
            const pedidas = solicitud?.fichasACargo ?? [];
            for (const id of fichas.filter((f) => !pedidas.includes(f))) await usuariosAdminApi.asignarFicha(usuario!.id, id);
            for (const id of pedidas.filter((f) => !fichas.includes(f))) await usuariosAdminApi.quitarFicha(usuario!.id, id);
        },
        onSuccess: () => { refrescar(); onClose(); },
    });

    const disponibles = (datos.fichas.data ?? []).filter((f) => f.estado !== 'finalizado' || fichas.includes(f.id));
    const alternar = (id: number) => setFichas((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    return (
        <Modal open={!!usuario} onClose={onClose} title="Aprobar solicitud">
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Confirmar rol: <strong>{solicitud?.rolSolicitado ?? '—'}</strong> para <strong>{nombreCompleto(usuario)}</strong>
                </p>
                {esInstructor && (
                    <div>
                        <label className="text-sm font-semibold text-foreground mb-2 block">Fichas a cargo</label>
                        {disponibles.length === 0 && <p className="text-sm text-muted-foreground">No hay fichas registradas</p>}
                        {disponibles.map((f) => (
                            <label key={f.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                                <input type="checkbox" checked={fichas.includes(f.id)} onChange={() => alternar(f.id)} className="accent-primary" />
                                <span className="text-sm">{f.ficha} — {f.nombre}</span>
                            </label>
                        ))}
                    </div>
                )}
                {aprobar.error && <Aviso tipo="error">{mensajeError(aprobar.error, 'No se pudo aprobar la solicitud')}</Aviso>}
                <BotonesModal textoConfirmar="Confirmar" onConfirmar={() => aprobar.mutate()} onCancelar={onClose} cargando={aprobar.isPending} />
            </div>
        </Modal>
    );
};

export const ModalRechazo = ({ usuario, onClose }: { usuario: UsuarioAdmin | null; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const [motivo, setMotivo] = useState('');
    useEffect(() => setMotivo(''), [usuario]);
    const rechazar = useMutation({
        mutationFn: () => usuariosAdminApi.rechazar(usuario!.id, motivo.trim()),
        onSuccess: () => { refrescar(); onClose(); },
    });
    return (
        <Modal open={!!usuario} onClose={onClose} title="Rechazar solicitud">
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    <strong>{nombreCompleto(usuario)}</strong> verá este motivo cuando intente iniciar sesión.
                </p>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-foreground">Motivo <span className="text-red-500">*</span></label>
                    <textarea
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        rows={3}
                        placeholder="Indica por qué se rechaza la solicitud..."
                        className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
                    />
                </div>
                {rechazar.error && <Aviso tipo="error">{mensajeError(rechazar.error, 'No se pudo rechazar la solicitud')}</Aviso>}
                <BotonesModal textoConfirmar="Rechazar" peligro onConfirmar={() => rechazar.mutate()} onCancelar={onClose} cargando={rechazar.isPending} deshabilitado={!motivo.trim()} />
            </div>
        </Modal>
    );
};

export const ModalContrasena = ({ usuario, onClose }: { usuario: UsuarioAdmin | null; onClose: () => void }) => {
    const [nueva, setNueva] = useState('');
    const [copiado, setCopiado] = useState(false);
    const restablecer = useMutation({
        mutationFn: () => usuariosAdminApi.restablecerContrasena(usuario!.id, nueva.trim() || undefined),
    });
    useEffect(() => { setNueva(''); setCopiado(false); restablecer.reset(); }, [usuario]);

    const resultado = restablecer.data?.data;
    const contrasena = resultado ? resultado.contrasenaTemporal ?? nueva : null;

    async function copiar() {
        if (!contrasena) return;
        try {
            await navigator.clipboard.writeText(contrasena);
            setCopiado(true);
        } catch {
            setCopiado(false);
        }
    }

    return (
        <Modal open={!!usuario} onClose={onClose} title={`Restablecer contraseña — ${nombreCompleto(usuario)}`}>
            {resultado ? (
                <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-xl text-center">
                        <p className="text-xs text-muted-foreground mb-1">Nueva contraseña</p>
                        <p className="text-xl font-mono font-bold text-foreground tracking-wider">{contrasena}</p>
                        <button type="button" onClick={copiar} className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary font-semibold">
                            <Copy size={14} />{copiado ? 'Copiada' : 'Copiar'}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Compártela con el usuario y pídele que la cambie desde su perfil.</p>
                    <Btn className="w-full justify-center" onClick={onClose}>Listo</Btn>
                </div>
            ) : (
                <div className="space-y-3">
                    <Input label="Nueva contraseña (opcional)" value={nueva} onChange={setNueva} placeholder="Déjala vacía para generar una temporal" />
                    {nueva.length > 0 && nueva.length < 8 && <p className="text-xs text-red-600">Mínimo 8 caracteres</p>}
                    {restablecer.error && <Aviso tipo="error">{mensajeError(restablecer.error, 'No se pudo restablecer la contraseña')}</Aviso>}
                    <BotonesModal
                        textoConfirmar="Restablecer"
                        onConfirmar={() => restablecer.mutate()}
                        onCancelar={onClose}
                        cargando={restablecer.isPending}
                        deshabilitado={nueva.length > 0 && nueva.length < 8}
                    />
                </div>
            )}
        </Modal>
    );
};

export const ModalCambiarRol = ({ usuario, datos, onClose }: { usuario: UsuarioAdmin | null; datos: DatosAdmin; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const [rolId, setRolId] = useState('');
    useEffect(() => setRolId(usuario ? String(usuario.rolId) : ''), [usuario]);
    const cambiar = useMutation({
        mutationFn: () => usuariosAdminApi.cambiarRol(usuario!.id, Number(rolId)),
        onSuccess: () => { refrescar(); onClose(); },
    });
    return (
        <Modal open={!!usuario} onClose={onClose} title={`Cambiar rol — ${nombreCompleto(usuario)}`}>
            <div className="space-y-3">
                <Select label="Nuevo rol" value={rolId} onChange={setRolId} options={(datos.roles.data ?? []).map((r) => ({ value: String(r.id), label: r.nombre }))} />
                {cambiar.error && <Aviso tipo="error">{mensajeError(cambiar.error, 'No se pudo cambiar el rol')}</Aviso>}
                <BotonesModal textoConfirmar="Guardar" onConfirmar={() => cambiar.mutate()} onCancelar={onClose} cargando={cambiar.isPending} deshabilitado={!rolId || Number(rolId) === usuario?.rolId} />
            </div>
        </Modal>
    );
};

export const ModalAsignarFichas = ({ usuario, datos, onClose }: { usuario: UsuarioAdmin | null; datos: DatosAdmin; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const actuales = useQuery({
        queryKey: ['admin', 'fichas-a-cargo', usuario?.id],
        queryFn: async () => (await usuariosAdminApi.fichasACargo(usuario!.id)).data,
        enabled: !!usuario,
    });
    const [seleccion, setSeleccion] = useState<number[]>([]);
    useEffect(() => setSeleccion(actuales.data ?? []), [actuales.data]);

    const guardar = useMutation({
        mutationFn: async () => {
            const antes = actuales.data ?? [];
            for (const id of seleccion.filter((f) => !antes.includes(f))) await usuariosAdminApi.asignarFicha(usuario!.id, id);
            for (const id of antes.filter((f) => !seleccion.includes(f))) await usuariosAdminApi.quitarFicha(usuario!.id, id);
        },
        onSuccess: () => { refrescar(); onClose(); },
    });

    const fichas = (datos.fichas.data ?? []).filter((f) => f.estado !== 'finalizado' || seleccion.includes(f.id));
    const alternar = (id: number) => setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    return (
        <Modal open={!!usuario} onClose={onClose} title={`Asignar fichas — ${nombreCompleto(usuario)}`}>
            <div className="space-y-3">
                {actuales.isLoading && <div className="h-24 rounded-lg bg-muted animate-pulse" />}
                {!actuales.isLoading && fichas.length === 0 && <p className="text-sm text-muted-foreground">No hay fichas registradas</p>}
                {!actuales.isLoading && fichas.map((f) => (
                    <div key={f.id} onClick={() => alternar(f.id)} className="flex items-center gap-3 p-3 rounded-lg bg-muted cursor-pointer hover:bg-primary/5">
                        <input type="checkbox" readOnly checked={seleccion.includes(f.id)} className="accent-primary" />
                        <span className="text-sm font-medium">Ficha {f.ficha}</span>
                        <span className="text-xs text-muted-foreground truncate">{f.nombre}</span>
                    </div>
                ))}
                {guardar.error && <Aviso tipo="error">{mensajeError(guardar.error, 'No se pudieron guardar las fichas')}</Aviso>}
                <BotonesModal textoConfirmar="Guardar" onConfirmar={() => guardar.mutate()} onCancelar={onClose} cargando={guardar.isPending} deshabilitado={actuales.isLoading} />
            </div>
        </Modal>
    );
};

export const ModalCambiarFicha = ({ usuario, datos, onClose }: { usuario: UsuarioAdmin | null; datos: DatosAdmin; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const [fichaId, setFichaId] = useState('');
    useEffect(() => setFichaId(usuario?.programaFormacionId ? String(usuario.programaFormacionId) : ''), [usuario]);
    const cambiar = useMutation({
        mutationFn: () => usuariosAdminApi.cambiarFicha(usuario!.id, fichaId ? Number(fichaId) : null),
        onSuccess: () => { refrescar(); onClose(); },
    });
    return (
        <Modal open={!!usuario} onClose={onClose} title={`Cambiar ficha — ${nombreCompleto(usuario)}`}>
            <div className="space-y-3">
                <Select
                    label="Ficha SENA"
                    value={fichaId}
                    onChange={setFichaId}
                    options={[{ value: '', label: 'Sin ficha asignada' }, ...(datos.fichas.data ?? []).map((f) => ({ value: String(f.id), label: `Ficha ${f.ficha} — ${f.nombre}` }))]}
                />
                {cambiar.error && <Aviso tipo="error">{mensajeError(cambiar.error, 'No se pudo cambiar la ficha')}</Aviso>}
                <BotonesModal textoConfirmar="Guardar" onConfirmar={() => cambiar.mutate()} onCancelar={onClose} cargando={cambiar.isPending} />
            </div>
        </Modal>
    );
};

export const ModalEditarPerfil = ({ usuario, onClose }: { usuario: UsuarioAdmin | null; onClose: () => void }) => {
    const refrescar = useRefrescarAdmin();
    const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', telefono: '' });
    useEffect(() => {
        if (usuario) setForm({ nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo, telefono: usuario.telefono ?? '' });
    }, [usuario]);
    const campo = (clave: keyof typeof form) => (valor: string) => setForm((f) => ({ ...f, [clave]: valor }));
    const guardar = useMutation({
        mutationFn: () => usuariosAdminApi.actualizar(usuario!.id, {
            nombre: form.nombre.trim(), apellido: form.apellido.trim(), correo: form.correo.trim(), telefono: form.telefono.trim(),
        }),
        onSuccess: () => { refrescar(); onClose(); },
    });
    const completo = form.nombre.trim() && form.apellido.trim() && form.correo.trim();
    return (
        <Modal open={!!usuario} onClose={onClose} title={`Editar perfil — ${nombreCompleto(usuario)}`}>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Nombre" value={form.nombre} onChange={campo('nombre')} required />
                    <Input label="Apellido" value={form.apellido} onChange={campo('apellido')} required />
                </div>
                <Input label="Correo electrónico" type="email" value={form.correo} onChange={campo('correo')} required />
                <Input label="Teléfono" value={form.telefono} onChange={campo('telefono')} />
                {guardar.error && <Aviso tipo="error">{mensajeError(guardar.error, 'No se pudo guardar el perfil')}</Aviso>}
                <BotonesModal textoConfirmar="Guardar" onConfirmar={() => guardar.mutate()} onCancelar={onClose} cargando={guardar.isPending} deshabilitado={!completo} />
            </div>
        </Modal>
    );
};

export const ModalConfirmar = ({ open, titulo, mensaje, textoConfirmar, peligro = false, cargando = false, error, onConfirmar, onClose }: {
    open: boolean; titulo: string; mensaje: ReactNode; textoConfirmar: string; peligro?: boolean; cargando?: boolean; error?: string | null;
    onConfirmar: () => void; onClose: () => void;
}) => (
    <Modal open={open} onClose={onClose} title={titulo}>
        <div className="space-y-3">
            {peligro ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">{mensaje}</div>
                </div>
            ) : (
                <div className="text-sm text-muted-foreground">{mensaje}</div>
            )}
            {error && <Aviso tipo="error">{error}</Aviso>}
            <BotonesModal textoConfirmar={textoConfirmar} peligro={peligro} onConfirmar={onConfirmar} onCancelar={onClose} cargando={cargando} />
        </div>
    </Modal>
);
