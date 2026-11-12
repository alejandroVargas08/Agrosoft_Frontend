import { useEffect, useRef, useState } from 'react';
import { Check, Clock, Edit2, GraduationCap, Key, MoreVertical, Plus, Shield, ToggleLeft, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Input, Modal, PageHeader, SearchBar, Select, StatusBadge, Textarea } from '../../components/ui/AgroUI';
import { useFichasACargo, useUsuarios } from '../../hooks/admin/useUsuarios';
import type { Usuario } from '../../api/usuarios/usuarios';
import type { ProgramaFormacion } from '../../api/programa_formacion/programasFormacion';

type Accion = 'perfil' | 'rol' | 'fichas' | 'estado' | 'contrasena' | 'rechazar' | 'eliminar';

const ESTADOS = [
    { value: '', label: 'Todos los estados' },
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'suspendido', label: 'Suspendido' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'rechazado', label: 'Rechazado' },
];

/** El diseño muestra el último ingreso en tiempo relativo, no como fecha. */
const hace = (valor: string | null) => {
    if (!valor) return 'Nunca';
    const ms = Date.now() - new Date(valor).getTime();
    const horas = Math.floor(ms / 3_600_000);
    if (horas < 1) return 'Hace un momento';
    if (horas < 24) return 'Hace ' + horas + 'h';
    return 'Hace ' + Math.floor(ms / 86_400_000) + 'd';
};

/** El diseño pinta el chip del rol de distinto color según cuál sea. */
const COLOR_ROL: Record<string, 'danger' | 'primary' | 'success'> = {
    Administrador: 'danger',
    Instructor: 'primary',
    Aprendiz: 'success',
};

/** Una opción del menú de tres puntos. */
const Opcion = ({ icono: Icono, children, onClick, peligro = false }: {
    icono: typeof Shield; children: React.ReactNode; onClick: () => void; peligro?: boolean;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={
            'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ' +
            (peligro ? 'text-destructive hover:bg-red-50' : 'text-foreground hover:bg-muted')
        }
    >
        <Icono size={14} />{children}
    </button>
);

/** El panel para asignar o quitar fichas a cargo de un instructor.
 *  Recibe todo por props: llamar a useUsuarios() aquí crearía una segunda
 *  instancia del hook, con su propio estado de carga. */
const FichasACargo = ({ usuario, programas, cambiarFicha, procesando }: {
    usuario: Usuario;
    programas: ProgramaFormacion[];
    cambiarFicha: (usuarioId: number, programaId: number, quitar: boolean) => void;
    procesando: boolean;
}) => {
    const { fichas, cargando } = useFichasACargo(usuario.id);

    if (cargando) return <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>;

    const activos = programas.filter((p) => p.estado === 'activo');

    if (activos.length === 0) {
        return <p className="text-sm text-muted-foreground">No hay fichas activas para asignar.</p>;
    }

    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
                Un instructor solo ve los datos de las fichas que tiene a cargo.
            </p>
            {activos.map((p) => {
                const tiene = fichas.includes(p.id);
                return (
                    <button
                        key={p.id}
                        type="button"
                        disabled={procesando}
                        onClick={() => cambiarFicha(usuario.id, p.id, tiene)}
                        className={
                            'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ' +
                            (tiene ? 'bg-primary/10 border border-primary/30' : 'bg-muted hover:bg-primary/5 border border-transparent')
                        }
                    >
                        <span
                            className={
                                'w-5 h-5 rounded flex items-center justify-center shrink-0 ' +
                                (tiene ? 'bg-primary text-white' : 'bg-white border border-border')
                            }
                        >
                            {tiene && <Check size={12} />}
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-medium font-mono">{p.ficha}</span>
                            <span className="block text-xs text-muted-foreground truncate">{p.nombre}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

const Usuarios = () => {
    const {
        usuarios, total, roles, programas, filtros, ponerFiltro,
        nombreRol, fichaDe, nombrePrograma,
        cargando, error, errorAccion, procesando,
        cambiarEstado, editarPerfil, cambiarRol, aprobar, rechazar, eliminar, cambiarFicha,
        restablecerContrasena, contrasenaGenerada, limpiarContrasena,
        crearUsuario, creando, contrasenaDelNuevo, limpiarNuevo,
    } = useUsuarios();

    const [abierto, setAbierto] = useState<{ usuario: Usuario; accion: Accion } | null>(null);
    const [rolElegido, setRolElegido] = useState('');
    const [motivo, setMotivo] = useState('');
    const [perfil, setPerfil] = useState({ nombre: '', apellido: '', correo: '', telefono: '' });
    const ponerPerfil = (clave: keyof typeof perfil) => (valor: string) =>
        setPerfil((p) => ({ ...p, [clave]: valor }));

    // El menú de tres puntos del diseño: uno abierto a la vez
    const [menuDe, setMenuDe] = useState<number | null>(null);
    const listaRef = useRef<HTMLDivElement | null>(null);

    // Sin esto el menú se queda abierto para siempre: ni el clic por fuera ni
    // Escape lo cierran, y queda asomado detrás de cualquier modal que se abra.
    useEffect(() => {
        if (menuDe === null) return;
        const porFuera = (evento: MouseEvent) => {
            if (!listaRef.current?.contains(evento.target as Node)) setMenuDe(null);
        };
        const porEscape = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') setMenuDe(null);
        };
        document.addEventListener('mousedown', porFuera);
        document.addEventListener('keydown', porEscape);
        return () => {
            document.removeEventListener('mousedown', porFuera);
            document.removeEventListener('keydown', porEscape);
        };
    }, [menuDe]);

    const [nuevoAbierto, setNuevoAbierto] = useState(false);
    const NUEVO_VACIO = { nombre: '', apellido: '', correo: '', identificacion: '', telefono: '', rolId: '', programaId: '' };
    const [nuevo, setNuevo] = useState(NUEVO_VACIO);
    const ponerNuevo = (clave: keyof typeof NUEVO_VACIO) => (valor: string) =>
        setNuevo((n) => ({ ...n, [clave]: valor }));

    const nuevoCompleto =
        nuevo.nombre.trim() !== '' && nuevo.apellido.trim() !== '' &&
        nuevo.correo.includes('@') && nuevo.identificacion.trim() !== '' && nuevo.rolId !== '';

    const cerrarNuevo = () => {
        setNuevoAbierto(false);
        setNuevo(NUEVO_VACIO);
        limpiarNuevo();
    };

    const guardarNuevo = () => {
        if (!nuevoCompleto) return;
        crearUsuario({
            nombre: nuevo.nombre.trim(),
            apellido: nuevo.apellido.trim(),
            correo: nuevo.correo.trim(),
            identificacion: nuevo.identificacion.trim(),
            ...(nuevo.telefono.trim() ? { telefono: nuevo.telefono.trim() } : {}),
            rolId: Number(nuevo.rolId),
            ...(nuevo.programaId ? { programaFormacionId: Number(nuevo.programaId) } : {}),
        }, () => toast.success('Usuario creado'));
    };

    const cerrar = () => {
        setAbierto(null);
        setMotivo('');
        limpiarContrasena();
    };

    const abrir = (usuario: Usuario, accion: Accion) => {
        setAbierto({ usuario, accion });
        setRolElegido(String(usuario.rolId));
        setMotivo('');
        setPerfil({
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            telefono: usuario.telefono ?? '',
        });
        limpiarContrasena();
        if (accion === 'contrasena') restablecerContrasena(usuario.id);
    };

    const TITULOS: Record<Accion, string> = {
        perfil: 'Editar perfil',
        rol: 'Cambiar rol',
        fichas: 'Fichas a cargo',
        estado: 'Cambiar estado',
        contrasena: 'Restablecer contraseña',
        rechazar: 'Rechazar usuario',
        eliminar: 'Eliminar usuario',
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Gestión de Usuarios"
                    subtitle={total === 1 ? '1 usuario registrado' : total + ' usuarios registrados'}
                    action={
                        <Btn onClick={() => setNuevoAbierto(true)}>
                            <Plus size={16} />Nuevo Usuario
                        </Btn>
                    }
                />

                {(error || errorAccion) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorAccion}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                    <SearchBar
                        value={filtros.texto}
                        onChange={(v) => ponerFiltro('texto', v)}
                        placeholder="Buscar por nombre o correo..."
                    />
                    <Select
                        value={filtros.rolId}
                        onChange={(v) => ponerFiltro('rolId', v)}
                        options={[
                            { value: '', label: 'Todos los roles' },
                            ...roles.map((r) => ({ value: String(r.id), label: r.nombre })),
                        ]}
                    />
                    <Select
                        value={filtros.programaId}
                        onChange={(v) => ponerFiltro('programaId', v)}
                        options={[
                            { value: '', label: 'Todas las fichas' },
                            ...programas.map((p) => ({ value: String(p.id), label: 'Ficha ' + p.ficha })),
                        ]}
                    />
                    <Select value={filtros.estado} onChange={(v) => ponerFiltro('estado', v)} options={ESTADOS} />
                </div>

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando usuarios...</p>
                ) : usuarios.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="Sin resultados"
                        description="Ningún usuario coincide con los filtros."
                    />
                ) : (
                    <div className="space-y-2" ref={listaRef}>
                        {usuarios.map((u) => {
                            const ficha = fichaDe(u.programaFormacionId);
                            const programa = nombrePrograma(u.programaFormacionId);
                            const rol = nombreRol(u.rolId);
                            return (
                                <Card key={u.id}>
                                    <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                            {u.nombre.charAt(0)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-foreground">{u.nombre} {u.apellido}</p>
                                                <Badge color={COLOR_ROL[rol] ?? 'primary'}>{rol}</Badge>
                                                <StatusBadge status={u.estado} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{u.correo}</p>
                                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                {ficha && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <GraduationCap size={10} />Ficha {ficha}
                                                    </span>
                                                )}
                                                {programa && (
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {programa}
                                                    </span>
                                                )}
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock size={10} />Último ingreso: {hace(u.ultimoIngreso)}
                                                </span>
                                            </div>
                                            {u.solicitud && (
                                                <p className="text-xs text-[#E65100] mt-1">
                                                    Pidió acceso como {u.solicitud.rolSolicitado}
                                                    {u.solicitud.cargo ? ' · ' + u.solicitud.cargo : ''}
                                                    {u.solicitud.motivoRechazo ? ' · Rechazado: ' + u.solicitud.motivoRechazo : ''}
                                                </p>
                                            )}
                                        </div>

                                        <div className="relative shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setMenuDe(menuDe === u.id ? null : u.id)}
                                                aria-label={'Acciones de ' + u.nombre}
                                                className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {menuDe === u.id && (
                                                <div className="absolute right-0 top-8 z-20 w-56 bg-white border border-border rounded-xl shadow-lg py-1">
                                                    <Opcion icono={Edit2} onClick={() => { setMenuDe(null); abrir(u, 'perfil'); }}>
                                                        Editar perfil
                                                    </Opcion>

                                                    {u.estado === 'pendiente' && (
                                                        <>
                                                            <Opcion icono={Check} onClick={() => { setMenuDe(null); aprobar(u.id); }}>
                                                                Aprobar
                                                            </Opcion>
                                                            <Opcion icono={X} onClick={() => { setMenuDe(null); abrir(u, 'rechazar'); }}>
                                                                Rechazar
                                                            </Opcion>
                                                        </>
                                                    )}

                                                    <Opcion icono={Shield} onClick={() => { setMenuDe(null); abrir(u, 'rol'); }}>
                                                        Cambiar rol
                                                    </Opcion>

                                                    {rol === 'Instructor' && (
                                                        <Opcion icono={GraduationCap} onClick={() => { setMenuDe(null); abrir(u, 'fichas'); }}>
                                                            Asignar fichas
                                                        </Opcion>
                                                    )}

                                                    {['activo', 'inactivo'].includes(u.estado) && (
                                                        <Opcion icono={ToggleLeft} onClick={() => { setMenuDe(null); abrir(u, 'estado'); }}>
                                                            {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                                        </Opcion>
                                                    )}

                                                    <Opcion icono={Key} onClick={() => { setMenuDe(null); abrir(u, 'contrasena'); }}>
                                                        Restablecer contraseña
                                                    </Opcion>

                                                    <hr className="my-1 border-border" />

                                                    <Opcion icono={Trash2} peligro onClick={() => { setMenuDe(null); abrir(u, 'eliminar'); }}>
                                                        Eliminar usuario
                                                    </Opcion>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <Modal
                    open={!!abierto}
                    onClose={cerrar}
                    title={abierto ? TITULOS[abierto.accion] : ''}
                >
                    {abierto && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">
                                    {abierto.usuario.nombre} {abierto.usuario.apellido}
                                </strong>{' '}
                                · {abierto.usuario.correo}
                            </p>

                            {abierto.accion === 'perfil' && (() => {
                                const datos = {
                                    nombre: perfil.nombre.trim(),
                                    apellido: perfil.apellido.trim(),
                                    correo: perfil.correo.trim(),
                                    telefono: perfil.telefono.trim(),
                                };
                                const completo = datos.nombre !== '' && datos.apellido !== '' && datos.correo.includes('@');
                                const u = abierto.usuario;
                                const cambio =
                                    datos.nombre !== u.nombre || datos.apellido !== u.apellido ||
                                    datos.correo !== u.correo || datos.telefono !== (u.telefono ?? '');
                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input label="Nombre" value={perfil.nombre} onChange={ponerPerfil('nombre')} required />
                                            <Input label="Apellido" value={perfil.apellido} onChange={ponerPerfil('apellido')} required />
                                        </div>
                                        <Input label="Correo electrónico" type="email" value={perfil.correo} onChange={ponerPerfil('correo')} required autoComplete="off" />
                                        <Input label="Teléfono" value={perfil.telefono} onChange={ponerPerfil('telefono')} autoComplete="off" />
                                        {errorAccion && <p className="text-sm text-red-600">{errorAccion}</p>}
                                        <div className="flex gap-3">
                                            <Btn
                                                disabled={procesando || !completo || !cambio}
                                                onClick={() => editarPerfil(u.id, datos, () => { cerrar(); toast.success('Perfil actualizado'); })}
                                                className="flex-1 justify-center"
                                            >
                                                {procesando ? 'Guardando...' : 'Guardar'}
                                            </Btn>
                                            <Btn variant="outline" onClick={cerrar} className="flex-1 justify-center">Cancelar</Btn>
                                        </div>
                                    </>
                                );
                            })()}

                            {abierto.accion === 'rol' && (
                                <>
                                    <Select
                                        label="Nuevo rol"
                                        value={rolElegido}
                                        onChange={setRolElegido}
                                        options={roles.map((r) => ({ value: String(r.id), label: r.nombre }))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Los permisos del rol nuevo se aplican cuando el usuario vuelva a iniciar sesión.
                                    </p>
                                    <div className="flex gap-3">
                                        <Btn
                                            disabled={procesando || Number(rolElegido) === abierto.usuario.rolId}
                                            onClick={() => cambiarRol(abierto.usuario.id, Number(rolElegido), cerrar)}
                                            className="flex-1 justify-center"
                                        >
                                            {procesando ? 'Guardando...' : 'Guardar'}
                                        </Btn>
                                        <Btn variant="outline" onClick={cerrar} className="flex-1 justify-center">Cancelar</Btn>
                                    </div>
                                </>
                            )}

                            {abierto.accion === 'fichas' && (
                                <FichasACargo
                                    usuario={abierto.usuario}
                                    programas={programas}
                                    cambiarFicha={cambiarFicha}
                                    procesando={procesando}
                                />
                            )}

                            {abierto.accion === 'estado' && (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        {abierto.usuario.estado === 'activo'
                                            ? 'Al desactivarla, la cuenta no podrá iniciar sesión. Los datos no se borran.'
                                            : 'Al activarla, la cuenta vuelve a poder iniciar sesión.'}
                                    </p>
                                    <div className="flex gap-3">
                                        <Btn
                                            disabled={procesando}
                                            onClick={() => cambiarEstado(abierto.usuario, cerrar)}
                                            className="flex-1 justify-center"
                                        >
                                            {procesando ? 'Guardando...' : abierto.usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                        </Btn>
                                        <Btn variant="outline" onClick={cerrar} className="flex-1 justify-center">Cancelar</Btn>
                                    </div>
                                </>
                            )}

                            {abierto.accion === 'contrasena' && (
                                contrasenaGenerada ? (
                                    <>
                                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                                            <p className="text-2xl font-bold font-mono text-primary tracking-wider break-all">
                                                {contrasenaGenerada}
                                            </p>
                                        </div>
                                        <p className="text-xs text-[#E65100]">
                                            Cópiala ahora: no se vuelve a mostrar. El usuario debería cambiarla al entrar.
                                        </p>
                                        <Btn onClick={cerrar} className="w-full justify-center">Listo</Btn>
                                    </>
                                ) : (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        {procesando ? 'Generando contraseña...' : 'No se pudo generar la contraseña.'}
                                    </p>
                                )
                            )}

                            {abierto.accion === 'rechazar' && (
                                <>
                                    <Textarea
                                        label="Motivo del rechazo"
                                        rows={3}
                                        value={motivo}
                                        onChange={setMotivo}
                                        required
                                        placeholder="Se lo mostraremos cuando intente iniciar sesión"
                                    />
                                    <div className="flex gap-3">
                                        <Btn
                                            variant="danger"
                                            disabled={procesando || motivo.trim().length === 0}
                                            onClick={() => rechazar(abierto.usuario.id, motivo.trim(), cerrar)}
                                            className="flex-1 justify-center"
                                        >
                                            {procesando ? 'Guardando...' : 'Rechazar'}
                                        </Btn>
                                        <Btn variant="outline" onClick={cerrar} className="flex-1 justify-center">Cancelar</Btn>
                                    </div>
                                </>
                            )}

                            {abierto.accion === 'eliminar' && (
                                <>
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                        <p className="text-sm text-red-700">
                                            La cuenta queda eliminada y no podrá iniciar sesión. Es un borrado lógico:
                                            lo que haya creado se conserva.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Btn
                                            variant="danger"
                                            disabled={procesando}
                                            onClick={() => eliminar(abierto.usuario.id, cerrar)}
                                            className="flex-1 justify-center"
                                        >
                                            {procesando ? 'Eliminando...' : 'Eliminar'}
                                        </Btn>
                                        <Btn variant="outline" onClick={cerrar} className="flex-1 justify-center">Cancelar</Btn>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </Modal>

                <Modal open={nuevoAbierto} onClose={cerrarNuevo} title="Nuevo Usuario">
                    {contrasenaDelNuevo ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Queda activo y puede entrar con esta contraseña.
                            </p>
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                                <p className="text-2xl font-bold font-mono text-primary tracking-wider break-all">
                                    {contrasenaDelNuevo}
                                </p>
                            </div>
                            <p className="text-xs text-[#E65100]">
                                Cópiala ahora: no se vuelve a mostrar. No se envía ningún correo.
                            </p>
                            <Btn onClick={cerrarNuevo} className="w-full justify-center">Listo</Btn>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Nombre" value={nuevo.nombre} onChange={ponerNuevo('nombre')} required />
                                <Input label="Apellido" value={nuevo.apellido} onChange={ponerNuevo('apellido')} required />
                            </div>

                            <Input
                                label="Correo electrónico"
                                type="email"
                                value={nuevo.correo}
                                onChange={ponerNuevo('correo')}
                                required
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Documento" value={nuevo.identificacion} onChange={ponerNuevo('identificacion')} required />
                                <Input label="Teléfono" value={nuevo.telefono} onChange={ponerNuevo('telefono')} />
                            </div>

                            <Select
                                label="Rol"
                                value={nuevo.rolId}
                                onChange={ponerNuevo('rolId')}
                                options={[
                                    { value: '', label: 'Seleccionar rol...' },
                                    ...roles.map((r) => ({ value: String(r.id), label: r.nombre })),
                                ]}
                            />

                            <Select
                                label="Ficha SENA"
                                value={nuevo.programaId}
                                onChange={ponerNuevo('programaId')}
                                options={[
                                    { value: '', label: 'Sin ficha asignada' },
                                    ...programas.map((p) => ({
                                        value: String(p.id),
                                        label: 'Ficha ' + p.ficha + ' — ' + p.nombre,
                                    })),
                                ]}
                            />

                            <div className="flex gap-3 pt-1">
                                <Btn
                                    disabled={!nuevoCompleto || creando}
                                    onClick={guardarNuevo}
                                    className="flex-1 justify-center"
                                >
                                    {creando ? 'Creando...' : 'Crear Usuario'}
                                </Btn>
                                <Btn variant="outline" onClick={cerrarNuevo} className="flex-1 justify-center">
                                    Cancelar
                                </Btn>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default Usuarios;
