import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, Clock, Edit2, GraduationCap, Key, MoreVertical, Plus, RefreshCw, Shield, ToggleLeft, Trash2, Users, X } from 'lucide-react';
import { Btn, Card, EmptyState, Input, Modal, PageHeader, SearchBar, Select } from '../../components/ui/AgroUI';
import {
    Aviso, BotonesModal, EstadoUsuarioBadge, Inicial, ModalAprobar, ModalAsignarFichas, ModalCambiarFicha, ModalCambiarRol,
    ModalConfirmar, ModalContrasena, ModalEditarPerfil, ModalRechazo, PaginaAdmin, RolBadge,
} from '../../components/admin/ComponentesAdmin';
import { usuariosAdminApi } from '../../api/admin/admin';
import { mensajeError } from '../../api/errores/errores';
import { useDatosAdmin, useEsAdmin, useRefrescarAdmin, type DatosAdmin } from '../../hooks/admin/useDatosAdmin';
import { ROL_APRENDIZ, ROL_INSTRUCTOR, type UsuarioAdmin } from '../../types/admin/admin';
import { coincide, generarContrasena, haceCuanto, nombreCompleto } from '../../utils/admin/admin';

type Dialogo = 'perfil' | 'aprobar' | 'rechazar' | 'rol' | 'fichas' | 'ficha' | 'estado' | 'contrasena' | 'eliminar';

const CLASE_SELECT = 'px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const CLASE_OPCION = 'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-foreground transition-colors';

const GestionUsuarios = () => {
    const datos = useDatosAdmin();
    const { miId } = useEsAdmin();
    const refrescar = useRefrescarAdmin();
    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [filtroFicha, setFiltroFicha] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [menuId, setMenuId] = useState<number | null>(null);
    const [nuevo, setNuevo] = useState(false);
    const [aviso, setAviso] = useState<string | null>(null);
    const [seleccion, setSeleccion] = useState<{ usuario: UsuarioAdmin; dialogo: Dialogo } | null>(null);

    const abrir = (usuario: UsuarioAdmin, dialogo: Dialogo) => { setMenuId(null); setSeleccion({ usuario, dialogo }); };
    const cerrar = () => setSeleccion(null);
    const elegido = (dialogo: Dialogo) => (seleccion?.dialogo === dialogo ? seleccion.usuario : null);

    const cambiarEstado = useMutation({
        mutationFn: (u: UsuarioAdmin) => usuariosAdminApi.cambiarEstado(u.id, u.estado === 'activo' ? 'inactivo' : 'activo'),
        onSuccess: () => { refrescar(); cerrar(); },
    });
    const eliminar = useMutation({
        mutationFn: (u: UsuarioAdmin) => usuariosAdminApi.eliminar(u.id),
        onSuccess: () => { refrescar(); cerrar(); },
    });

    const usuarios = datos.usuarios.data ?? [];
    const filtrados = useMemo(() => usuarios
        .filter((u) => coincide(busqueda, nombreCompleto(u), u.correo, u.identificacion))
        .filter((u) => !filtroRol || String(u.rolId) === filtroRol)
        .filter((u) => !filtroFicha || String(u.programaFormacionId) === filtroFicha)
        .filter((u) => !filtroEstado || u.estado === filtroEstado)
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es')), [usuarios, busqueda, filtroRol, filtroFicha, filtroEstado]);

    const fichasACargo = (u: UsuarioAdmin) => (datos.fichas.data ?? []).filter((f) => f.instructores.some((i) => i.id === u.id));
    const usuarioEstado = elegido('estado');
    const usuarioEliminar = elegido('eliminar');

    return (
        <PaginaAdmin>
            <PageHeader
                title="Gestión de Usuarios"
                subtitle={`${usuarios.length} usuarios registrados`}
                action={<Btn onClick={() => setNuevo(true)}><Plus size={16} />Nuevo Usuario</Btn>}
            />

            {aviso && <div className="mb-4"><Aviso tipo="exito">{aviso}</Aviso></div>}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o correo..." />
                <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className={CLASE_SELECT}>
                    <option value="">Todos los roles</option>
                    {(datos.roles.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
                <select value={filtroFicha} onChange={(e) => setFiltroFicha(e.target.value)} className={CLASE_SELECT}>
                    <option value="">Todas las fichas</option>
                    {(datos.fichas.data ?? []).map((f) => <option key={f.id} value={f.id}>Ficha {f.ficha}</option>)}
                </select>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={CLASE_SELECT}>
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="rechazado">Rechazado</option>
                </select>
            </div>

            {datos.error && <div className="mb-4"><Aviso tipo="error">{mensajeError(datos.error, 'No se pudieron cargar los usuarios')}</Aviso></div>}

            {datos.cargando ? (
                <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : (
                <div className="space-y-2">
                    {filtrados.map((u) => {
                        const pendiente = u.estado === 'pendiente';
                        const esYo = u.id === miId;
                        const esInstructor = datos.esRol(u, ROL_INSTRUCTOR);
                        const esAprendiz = datos.esRol(u, ROL_APRENDIZ);
                        const ficha = u.programaFormacionId ? datos.fichaPorId.get(u.programaFormacionId) : null;
                        const aCargo = esInstructor ? fichasACargo(u) : [];
                        return (
                            <Card key={u.id}>
                                <div className="flex items-center gap-3">
                                    <Inicial nombre={u.nombre} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-foreground">{nombreCompleto(u)}{esYo && <span className="ml-1 text-xs font-normal text-muted-foreground">(tú)</span>}</p>
                                            <RolBadge nombre={datos.rolDe(u)} />
                                            <EstadoUsuarioBadge estado={u.estado} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">{u.correo}</p>
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                            {ficha && <p className="text-xs text-muted-foreground"><GraduationCap size={10} className="inline mr-1" />Ficha {ficha.ficha}</p>}
                                            {ficha && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{ficha.nombre}</p>}
                                            {esInstructor && aCargo.length > 0 && (
                                                <p className="text-xs text-muted-foreground"><GraduationCap size={10} className="inline mr-1" />Fichas {aCargo.map((f) => f.ficha).join(', ')}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} />Último ingreso: {haceCuanto(u.ultimoIngreso)}</p>
                                        </div>
                                    </div>
                                    <div className="relative shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                                            aria-label="Acciones"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {menuId === u.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                                                <div className="absolute right-0 top-8 z-20 w-52 bg-white border border-border rounded-xl shadow-lg py-1">
                                                    <button type="button" onClick={() => abrir(u, 'perfil')} className={CLASE_OPCION}><Edit2 size={14} />Editar perfil</button>
                                                    {pendiente && <button type="button" onClick={() => abrir(u, 'aprobar')} className={CLASE_OPCION}><Check size={14} />Aprobar</button>}
                                                    {pendiente && <button type="button" onClick={() => abrir(u, 'rechazar')} className={CLASE_OPCION}><X size={14} />Rechazar</button>}
                                                    {!pendiente && !esYo && <button type="button" onClick={() => abrir(u, 'rol')} className={CLASE_OPCION}><Shield size={14} />Cambiar rol</button>}
                                                    {!pendiente && esInstructor && <button type="button" onClick={() => abrir(u, 'fichas')} className={CLASE_OPCION}><GraduationCap size={14} />Asignar fichas</button>}
                                                    {esAprendiz && <button type="button" onClick={() => abrir(u, 'ficha')} className={CLASE_OPCION}><GraduationCap size={14} />Cambiar ficha</button>}
                                                    {!pendiente && !esYo && u.estado !== 'rechazado' && (
                                                        <button type="button" onClick={() => abrir(u, 'estado')} className={CLASE_OPCION}><ToggleLeft size={14} />{u.estado === 'activo' ? 'Desactivar' : 'Activar'}</button>
                                                    )}
                                                    {!pendiente && <button type="button" onClick={() => abrir(u, 'contrasena')} className={CLASE_OPCION}><Key size={14} />Restablecer contraseña</button>}
                                                    {!esYo && (
                                                        <>
                                                            <hr className="my-1 border-border" />
                                                            <button type="button" onClick={() => abrir(u, 'eliminar')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-destructive transition-colors">
                                                                <Trash2 size={14} />Eliminar usuario
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {filtrados.length === 0 && <EmptyState icon={Users} title="Sin resultados" description="No hay usuarios que coincidan con los filtros" />}
                </div>
            )}

            <ModalNuevoUsuario abierto={nuevo} datos={datos} onClose={() => setNuevo(false)} onCreado={(texto) => { setAviso(texto); refrescar(); }} />
            <ModalEditarPerfil usuario={elegido('perfil')} onClose={cerrar} />
            <ModalAprobar usuario={elegido('aprobar')} datos={datos} onClose={cerrar} />
            <ModalRechazo usuario={elegido('rechazar')} onClose={cerrar} />
            <ModalCambiarRol usuario={elegido('rol')} datos={datos} onClose={cerrar} />
            <ModalAsignarFichas usuario={elegido('fichas')} datos={datos} onClose={cerrar} />
            <ModalCambiarFicha usuario={elegido('ficha')} datos={datos} onClose={cerrar} />
            <ModalContrasena usuario={elegido('contrasena')} onClose={cerrar} />

            <ModalConfirmar
                open={!!usuarioEstado}
                titulo={usuarioEstado?.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                mensaje={usuarioEstado?.estado === 'activo'
                    ? <><strong>{nombreCompleto(usuarioEstado)}</strong> no podrá iniciar sesión hasta que lo vuelvas a activar.</>
                    : <><strong>{nombreCompleto(usuarioEstado)}</strong> podrá volver a iniciar sesión.</>}
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
                mensaje={<>Se eliminará a <strong>{nombreCompleto(usuarioEliminar)}</strong>. Ya no podrá ingresar y dejará de aparecer en AgroSoft.</>}
                textoConfirmar="Eliminar usuario"
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
            onCreado(`Usuario creado: ${nombreCompleto(usuario)} (${nombreRol}). Contraseña inicial: ${form.password}`);
            cerrar();
        },
    });

    function cerrar() {
        setForm(FORM_VACIO);
        setFichasInstructor([]);
        crear.reset();
        onClose();
    }

    const completo = form.nombre.trim() && form.apellido.trim() && form.identificacion.trim() && form.telefono.trim() && form.email.trim() && form.password.length >= 6 && rolId;

    return (
        <Modal open={abierto} onClose={cerrar} title="Nuevo Usuario">
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Nombre" value={form.nombre} onChange={campo('nombre')} required />
                    <Input label="Apellido" value={form.apellido} onChange={campo('apellido')} required />
                    <Input label="Documento" value={form.identificacion} onChange={campo('identificacion')} required />
                    <Input label="Teléfono" value={form.telefono} onChange={campo('telefono')} required />
                </div>
                <Input label="Correo electrónico" type="email" value={form.email} onChange={campo('email')} required />
                <div className="flex items-end gap-2">
                    <Input label="Contraseña inicial" value={form.password} onChange={campo('password')} required className="flex-1" placeholder="Mínimo 6 caracteres" />
                    <Btn variant="outline" onClick={() => campo('password')(generarContrasena())}><RefreshCw size={14} />Generar</Btn>
                </div>
                <Select label="Rol" value={rolId} onChange={campo('rolId')} options={(datos.roles.data ?? []).map((r) => ({ value: String(r.id), label: r.nombre }))} />
                {esAprendiz && (
                    <Select
                        label="Ficha SENA"
                        value={form.fichaId}
                        onChange={campo('fichaId')}
                        options={[{ value: '', label: 'Sin ficha asignada' }, ...fichas.map((f) => ({ value: String(f.id), label: `Ficha ${f.ficha} — ${f.nombre}` }))]}
                    />
                )}
                {esInstructor && (
                    <div>
                        <label className="text-sm font-semibold text-foreground mb-2 block">Fichas a cargo</label>
                        {fichas.length === 0 && <p className="text-sm text-muted-foreground">No hay fichas activas</p>}
                        {fichas.map((f) => (
                            <label key={f.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={fichasInstructor.includes(f.id)}
                                    onChange={() => setFichasInstructor((s) => (s.includes(f.id) ? s.filter((x) => x !== f.id) : [...s, f.id]))}
                                    className="accent-primary"
                                />
                                <span className="text-sm">{f.ficha} — {f.nombre}</span>
                            </label>
                        ))}
                    </div>
                )}
                {crear.error && <Aviso tipo="error">{mensajeError(crear.error, 'No se pudo crear el usuario')}</Aviso>}
                <BotonesModal textoConfirmar="Crear Usuario" onConfirmar={() => crear.mutate()} onCancelar={cerrar} cargando={crear.isPending} deshabilitado={!completo} />
            </div>
        </Modal>
    );
};

export default GestionUsuarios;
