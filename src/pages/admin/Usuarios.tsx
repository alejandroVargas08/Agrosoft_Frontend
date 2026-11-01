import { useState } from 'react';
import { Check, Clock, GraduationCap, Key, Shield, ToggleLeft, Trash2, Users, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Btn, Card, EmptyState, Modal, PageHeader, SearchBar, Select, StatusBadge, Textarea } from '../../components/ui/AgroUI';
import { useFichasACargo, useUsuarios } from '../../hooks/admin/useUsuarios';
import type { Usuario } from '../../api/usuarios/usuarios';
import type { ProgramaFormacion } from '../../api/programa_formacion/programasFormacion';

type Accion = 'rol' | 'fichas' | 'estado' | 'contrasena' | 'rechazar' | 'eliminar';

const ESTADOS = [
    { value: '', label: 'Todos los estados' },
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'suspendido', label: 'Suspendido' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'rechazado', label: 'Rechazado' },
];

const fecha = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Nunca';

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
        cambiarEstado, cambiarRol, aprobar, rechazar, eliminar, cambiarFicha,
        restablecerContrasena, contrasenaGenerada, limpiarContrasena,
    } = useUsuarios();

    const [abierto, setAbierto] = useState<{ usuario: Usuario; accion: Accion } | null>(null);
    const [rolElegido, setRolElegido] = useState('');
    const [motivo, setMotivo] = useState('');

    const cerrar = () => {
        setAbierto(null);
        setMotivo('');
        limpiarContrasena();
    };

    const abrir = (usuario: Usuario, accion: Accion) => {
        setAbierto({ usuario, accion });
        setRolElegido(String(usuario.rolId));
        setMotivo('');
        limpiarContrasena();
        if (accion === 'contrasena') restablecerContrasena(usuario.id);
    };

    const TITULOS: Record<Accion, string> = {
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
                    title="Usuarios"
                    subtitle={total === 1 ? '1 usuario registrado' : total + ' usuarios registrados'}
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
                        placeholder="Nombre, correo o documento..."
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
                    <div className="space-y-2">
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
                                                <Badge color="primary">{rol}</Badge>
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
                                                    <Clock size={10} />Último ingreso: {fecha(u.ultimoIngreso)}
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

                                        <div className="flex gap-1 flex-wrap shrink-0">
                                            {u.estado === 'pendiente' && (
                                                <>
                                                    <Btn size="sm" disabled={procesando} onClick={() => aprobar(u.id)}>
                                                        <Check size={12} />Aprobar
                                                    </Btn>
                                                    <Btn size="sm" variant="danger" onClick={() => abrir(u, 'rechazar')}>
                                                        <X size={12} />Rechazar
                                                    </Btn>
                                                </>
                                            )}
                                            <Btn size="sm" variant="outline" onClick={() => abrir(u, 'rol')}>
                                                <Shield size={12} />Rol
                                            </Btn>
                                            {rol === 'Instructor' && (
                                                <Btn size="sm" variant="outline" onClick={() => abrir(u, 'fichas')}>
                                                    <GraduationCap size={12} />Fichas
                                                </Btn>
                                            )}
                                            {['activo', 'inactivo'].includes(u.estado) && (
                                                <Btn size="sm" variant="outline" onClick={() => abrir(u, 'estado')}>
                                                    <ToggleLeft size={12} />
                                                    {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                                </Btn>
                                            )}
                                            <Btn size="sm" variant="outline" onClick={() => abrir(u, 'contrasena')}>
                                                <Key size={12} />Contraseña
                                            </Btn>
                                            <Btn size="sm" variant="ghost" onClick={() => abrir(u, 'eliminar')}>
                                                <Trash2 size={12} />
                                            </Btn>
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
            </div>
        </DashboardLayout>
    );
};

export default Usuarios;
