import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, GraduationCap, KeyRound, Power, RefreshCw, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react';
import { Btn, EmptyState, Input, Modal, PageHeader, SearchBar, Select } from '../../components/ui/AgroUI';
import { Aviso, Avatar, EstadoUsuarioBadge, MenuAcciones, ModalAprobar, ModalCambiarRol, ModalConfirmar, ModalContrasena, ModalFichaAprendiz, ModalFichasInstructor, ModalRechazo, PaginaAdmin, RolBadge } from '../../components/admin/ComponentesAdmin';
import { usuariosAdminApi } from '../../api/admin/admin';
import { mensajeError } from '../../api/errores/errores';
import { useDatosAdmin, useEsAdmin, useRefrescarAdmin, type DatosAdmin } from '../../hooks/admin/useDatosAdmin';
import { ROL_APRENDIZ, ROL_INSTRUCTOR, type UsuarioAdmin } from '../../types/admin/admin';
import { coincide, generarContrasena, haceCuanto, nombreCompleto } from '../../utils/admin/admin';

type Dialogo = 'rol' | 'ficha' | 'fichas' | 'contrasena' | 'estado' | 'eliminar' | 'aprobar' | 'rechazar';

const ESTADOS = [
    { value: '', label: 'Todos los estados' },
    { value: 'activo', label: 'Activos' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'inactivo', label: 'Inactivos' },
    { value: 'rechazado', label: 'Rechazados' },
];

const Usuarios = () => {
    const datos = useDatosAdmin();
    const { miId } = useEsAdmin();
    const refrescar = useRefrescarAdmin();
    const [busqueda, setBusqueda] = useState('');
    const [rol, setRol] = useState('');
    const [ficha, setFicha] = useState('');
    const [estado, setEstado] = useState('');
    const [nuevo, setNuevo] = useState(false);
    const [seleccion, setSeleccion] = useState<{ usuario: UsuarioAdmin; dialogo: Dialogo } | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);

    const cerrar = () => setSeleccion(null);
    const abrir = (usuario: UsuarioAdmin, dialogo: Dialogo) => setSeleccion({ usuario, dialogo });
    const elegido = (dialogo: Dialogo) => (seleccion?.dialogo === dialogo ? seleccion.usuario : null);

    const cambiarEstado = useMutation({
        mutationFn: (u: UsuarioAdmin) => usuariosAdminApi.cambiarEstado(u.id, u.estado === 'activo' ? 'inactivo' : 'activo'),
        onSuccess: () => { refrescar(); cerrar(); },
    });
    const eliminar = useMutation({
        mutationFn: (u: UsuarioAdmin) => usuariosAdminApi.eliminar(u.id),
        onSuccess: () => { refrescar(); cerrar(); },
    });

    const usuarios = useMemo(() => {
        return (datos.usuarios.data ?? [])
            .filter((u) => coincide(busqueda, u.nombre, u.apellido, nombreCompleto(u), u.correo, u.identificacion))
            .filter((u) => !rol || String(u.rolId) === rol)
            .filter((u) => !estado || u.estado === estado)
            .filter((u) => !ficha || String(u.programaFormacionId) === ficha)
            .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'));
    }, [datos.usuarios.data, busqueda, rol, estado, ficha]);

    const opcionesRol = [{ value: '', label: 'Todos los roles' }, ...(datos.roles.data ?? []).map((r) => ({ value: String(r.id), label: r.nombre }))];
    const opcionesFicha = [{ value: '', label: 'Todas las fichas' }, ...(datos.fichas.data ?? []).map((f) => ({ value: String(f.id), label: `${f.ficha} · ${f.nombre}` }))];

    const textoFicha = (u: UsuarioAdmin) => {
        if (datos.esRol(u, ROL_INSTRUCTOR)) {
            const total = (datos.fichas.data ?? []).filter((f) => f.instructores.some((i) => i.id === u.id)).length;
            return total === 0 ? 'Sin fichas' : `${total} ficha${total === 1 ? '' : 's'} a cargo`;
        }
        const f = u.programaFormacionId ? datos.fichaPorId.get(u.programaFormacionId) : null;
        return f ? f.ficha : u.idFicha ?? '—';
    };

    const acciones = (u: UsuarioAdmin) => {
        const pendiente = u.estado === 'pendiente';
        const esYo = u.id === miId;
        return [
            { label: 'Aprobar', icon: Check, onClick: () => abrir(u, 'aprobar'), oculta: !pendiente },
            { label: 'Rechazar', icon: X, onClick: () => abrir(u, 'rechazar'), oculta: !pendiente, peligro: true },
            { label: 'Cambiar rol', icon: ShieldCheck, onClick: () => abrir(u, 'rol'), oculta: pendiente || esYo },
            { label: 'Fichas a cargo', icon: GraduationCap, onClick: () => abrir(u, 'fichas'), oculta: pendiente || !datos.esRol(u, ROL_INSTRUCTOR) },
            { label: 'Cambiar ficha', icon: GraduationCap, onClick: () => abrir(u, 'ficha'), oculta: !datos.esRol(u, ROL_APRENDIZ) },
            { label: 'Restablecer contraseña', icon: KeyRound, onClick: () => abrir(u, 'contrasena'), oculta: pendiente },
            { label: u.estado === 'activo' ? 'Desactivar' : 'Activar', icon: Power, onClick: () => abrir(u, 'estado'), oculta: pendiente || u.estado === 'rechazado' || esYo, peligro: u.estado === 'activo' },
            { label: 'Eliminar', icon: Trash2, onClick: () => abrir(u, 'eliminar'), oculta: esYo, peligro: true },
        ];
    };

    const usuarioEstado = elegido('estado');
    const usuarioEliminar = elegido('eliminar');

    return (
        <PaginaAdmin>
            <PageHeader
                title="Usuarios"
                subtitle={`${datos.usuarios.data?.length ?? 0} usuarios registrados`}
                action={<Btn onClick={() => setNuevo(true)}><UserPlus size={16} />Nuevo usuario</Btn>}
            />

            {mensaje && <div className="mb-4"><Aviso tipo="exito">{mensaje}</Aviso></div>}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
                <div className="md:col-span-4 lg:col-span-1"><SearchBar value={busqueda} onChange={setBusqueda} placeholder="Nombre, correo o documento" /></div>
                <Select value={rol} onChange={setRol} options={opcionesRol} />
                <Select value={ficha} onChange={setFicha} options={opcionesFicha} />
                <Select value={estado} onChange={setEstado} options={ESTADOS} />
            </div>

            {datos.error && <div className="mb-4"><Aviso tipo="error">{mensajeError(datos.error, 'No se pudieron cargar los usuarios')}</Aviso></div>}

            {datos.cargando && <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>}

            {!datos.cargando && !datos.error && usuarios.length === 0 && (
                <EmptyState icon={Users} title="No hay usuarios" description="Ningún usuario coincide con los filtros." />
            )}

            {!datos.cargando && usuarios.length > 0 && (
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                    <table className="w-full text-sm min-w-[860px]">
                        <thead>
                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                <th className="p-3 font-semibold">Usuario</th>
                                <th className="p-3 font-semibold">Documento</th>
                                <th className="p-3 font-semibold">Rol</th>
                                <th className="p-3 font-semibold">Ficha</th>
                                <th className="p-3 font-semibold">Estado</th>
                                <th className="p-3 font-semibold">Último ingreso</th>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {usuarios.map((u) => (
                                <tr key={u.id} className="hover:bg-muted/40">
                                    <td className="p-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar persona={u} tamano="sm" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-foreground truncate">{nombreCompleto(u)}{u.id === miId && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(tú)</span>}</p>
                                                <p className="text-xs text-muted-foreground truncate">{u.correo}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-muted-foreground">{u.identificacion}</td>
                                    <td className="p-3"><RolBadge nombre={datos.rolDe(u)} /></td>
                                    <td className="p-3 text-muted-foreground">{textoFicha(u)}</td>
                                    <td className="p-3"><EstadoUsuarioBadge estado={u.estado} /></td>
                                    <td className="p-3 text-muted-foreground whitespace-nowrap">{haceCuanto(u.ultimoIngreso)}</td>
                                    <td className="p-3 text-right"><MenuAcciones acciones={acciones(u)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ModalNuevoUsuario abierto={nuevo} datos={datos} onClose={() => setNuevo(false)} onCreado={(texto) => { setMensaje(texto); refrescar(); }} />
            <ModalCambiarRol usuario={elegido('rol')} datos={datos} onClose={cerrar} />
            <ModalFichaAprendiz usuario={elegido('ficha')} datos={datos} onClose={cerrar} />
            <ModalFichasInstructor usuario={elegido('fichas')} datos={datos} onClose={cerrar} />
            <ModalContrasena usuario={elegido('contrasena')} onClose={cerrar} />
            <ModalAprobar usuario={elegido('aprobar')} fichaPorId={datos.fichaPorId} onClose={cerrar} />
            <ModalRechazo usuario={elegido('rechazar')} onClose={cerrar} />

            <ModalConfirmar
                open={!!usuarioEstado}
                titulo={usuarioEstado?.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                mensaje={usuarioEstado?.estado === 'activo'
                    ? <>¿Desactivar a <b>{nombreCompleto(usuarioEstado)}</b>? No podrá iniciar sesión hasta que lo vuelvas a activar.</>
                    : <>¿Activar a <b>{nombreCompleto(usuarioEstado)}</b>? Podrá volver a iniciar sesión.</>}
                textoConfirmar={usuarioEstado?.estado === 'activo' ? 'Desactivar' : 'Activar'}
                peligro={usuarioEstado?.estado === 'activo'}
                cargando={cambiarEstado.isPending}
                error={cambiarEstado.error ? mensajeError(cambiarEstado.error, 'No se pudo cambiar el estado') : null}
                onConfirmar={() => usuarioEstado && cambiarEstado.mutate(usuarioEstado)}
                onClose={() => { cambiarEstado.reset(); cerrar(); }}
            />
            <ModalConfirmar
                open={!!usuarioEliminar}
                titulo="Eliminar usuario"
                mensaje={<>¿Eliminar a <b>{nombreCompleto(usuarioEliminar)}</b>? Ya no aparecerá en AgroSoft, pero su historial se conserva.</>}
                textoConfirmar="Eliminar"
                peligro
                cargando={eliminar.isPending}
                error={eliminar.error ? mensajeError(eliminar.error, 'No se pudo eliminar el usuario') : null}
                onConfirmar={() => usuarioEliminar && eliminar.mutate(usuarioEliminar)}
                onClose={() => { eliminar.reset(); cerrar(); }}
            />
        </PaginaAdmin>
    );
};

const FORM_VACIO = { nombre: '', apellido: '', identificacion: '', telefono: '', email: '', password: '', rolId: '', fichaId: '' };

const ModalNuevoUsuario = ({ abierto, datos, onClose, onCreado }: { abierto: boolean; datos: DatosAdmin; onClose: () => void; onCreado: (texto: string) => void }) => {
    const [form, setForm] = useState(FORM_VACIO);
    const [fichasInstructor, setFichasInstructor] = useState<number[]>([]);
    const campo = (clave: keyof typeof FORM_VACIO) => (valor: string) => setForm((f) => ({ ...f, [clave]: valor }));

    const rolAprendiz = datos.rolPorNombre(ROL_APRENDIZ);
    const rolId = form.rolId || (rolAprendiz ? String(rolAprendiz.id) : '');
    const nombreRol = datos.rolPorId.get(Number(rolId))?.nombre ?? '';
    const esAprendiz = nombreRol === ROL_APRENDIZ;
    const esInstructor = nombreRol === ROL_INSTRUCTOR;
    const fichas = (datos.fichas.data ?? []).filter((f) => f.estado !== 'finalizado');

    const cerrar = () => { setForm(FORM_VACIO); setFichasInstructor([]); crear.reset(); onClose(); };

    const crear = useMutation({
        mutationFn: async () => {
            const ficha = esAprendiz && form.fichaId ? datos.fichaPorId.get(Number(form.fichaId)) : null;
            const { data: usuario } = await usuariosAdminApi.crear({
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                identificacion: form.identificacion.trim(),
                telefono: form.telefono.trim(),
                email: form.email.trim(),
                password: form.password,
                idFicha: ficha?.ficha,
            });
            if (rolAprendiz && Number(rolId) !== rolAprendiz.id) await usuariosAdminApi.cambiarRol(usuario.id, Number(rolId));
            if (esInstructor) for (const id of fichasInstructor) await usuariosAdminApi.asignarFicha(usuario.id, id);
            return usuario;
        },
        onSuccess: (usuario) => {
            onCreado(`Se creó a ${nombreCompleto(usuario)} como ${nombreRol}. Contraseña inicial: ${form.password}`);
            cerrar();
        },
    });

    const completo = form.nombre.trim() && form.apellido.trim() && form.identificacion.trim() && form.telefono.trim() && form.email.trim() && form.password.length >= 6 && rolId;

    return (
        <Modal open={abierto} onClose={cerrar} title="Nuevo usuario">
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Nombre" value={form.nombre} onChange={campo('nombre')} required />
                    <Input label="Apellido" value={form.apellido} onChange={campo('apellido')} required />
                    <Input label="Documento" value={form.identificacion} onChange={campo('identificacion')} required />
                    <Input label="Teléfono" value={form.telefono} onChange={campo('telefono')} required />
                </div>
                <Input label="Correo" type="email" value={form.email} onChange={campo('email')} required />
                <div className="flex items-end gap-2">
                    <Input label="Contraseña inicial" value={form.password} onChange={campo('password')} required className="flex-1" placeholder="Mínimo 6 caracteres" />
                    <Btn variant="outline" onClick={() => campo('password')(generarContrasena())}><RefreshCw size={15} />Generar</Btn>
                </div>
                <Select label="Rol" value={rolId} onChange={campo('rolId')} options={(datos.roles.data ?? []).map((r) => ({ value: String(r.id), label: r.nombre }))} />

                {esAprendiz && (
                    <Select
                        label="Ficha"
                        value={form.fichaId}
                        onChange={campo('fichaId')}
                        options={[{ value: '', label: 'Sin ficha' }, ...fichas.map((f) => ({ value: String(f.id), label: `${f.ficha} · ${f.nombre}` }))]}
                    />
                )}

                {esInstructor && (
                    <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Fichas a cargo</p>
                        <div className="max-h-40 overflow-y-auto divide-y divide-border rounded-xl border border-border">
                            {fichas.length === 0 && <p className="p-3 text-sm text-muted-foreground">No hay fichas activas</p>}
                            {fichas.map((f) => (
                                <label key={f.id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/50">
                                    <input
                                        type="checkbox"
                                        checked={fichasInstructor.includes(f.id)}
                                        onChange={() => setFichasInstructor((s) => (s.includes(f.id) ? s.filter((x) => x !== f.id) : [...s, f.id]))}
                                        className="w-4 h-4 accent-[#2d7a3e]"
                                    />
                                    <span className="text-sm text-foreground">{f.ficha} · <span className="text-muted-foreground">{f.nombre}</span></span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-xs text-muted-foreground">El usuario queda activo y puede entrar de una vez con la contraseña inicial.</p>
                {crear.error && <Aviso tipo="error">{mensajeError(crear.error, 'No se pudo crear el usuario')}</Aviso>}
                <div className="flex justify-end gap-2 pt-1">
                    <Btn variant="outline" onClick={cerrar}>Cancelar</Btn>
                    <Btn onClick={() => crear.mutate()} disabled={!completo || crear.isPending}>{crear.isPending ? 'Creando...' : 'Crear usuario'}</Btn>
                </div>
            </div>
        </Modal>
    );
};

export default Usuarios;
