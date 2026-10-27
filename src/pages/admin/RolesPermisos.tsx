import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, Info, Lock, Minus, Plus } from 'lucide-react';
import { Btn, Card, Input, Modal, PageHeader, SearchBar } from '../../components/ui/AgroUI';
import { Aviso, BotonesModal, PaginaAdmin } from '../../components/admin/ComponentesAdmin';
import { rolesAdminApi } from '../../api/admin/admin';
import { mensajeError } from '../../api/errores/errores';
import { useDatosAdmin, useRefrescarAdmin } from '../../hooks/admin/useDatosAdmin';
import { PERMISO_ADMIN, ROL_ADMIN, type Permiso } from '../../types/admin/admin';
import { agruparPermisos, coincide } from '../../utils/admin/admin';

const RolesPermisos = () => {
    const datos = useDatosAdmin();
    const refrescar = useRefrescarAdmin();
    const [rolId, setRolId] = useState<number | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [nuevoRol, setNuevoRol] = useState(false);

    const roles = useMemo(() => [...(datos.roles.data ?? [])].sort((a, b) => a.id - b.id), [datos.roles.data]);
    useEffect(() => {
        if (rolId === null && roles.length > 0) setRolId(roles[0].id);
    }, [roles, rolId]);

    const permisos = useQuery({
        queryKey: ['admin', 'permisos'],
        queryFn: async () => (await rolesAdminApi.permisos()).data,
        staleTime: 1000 * 60 * 5,
    });
    const delRol = useQuery({
        queryKey: ['admin', 'rol-permisos', rolId],
        queryFn: async () => (await rolesAdminApi.permisosDeRol(rolId!)).data,
        enabled: rolId !== null,
    });
    const alternar = useMutation({
        mutationFn: ({ permiso, activo }: { permiso: Permiso; activo: boolean }) =>
            activo ? rolesAdminApi.quitarPermiso(rolId!, permiso.id) : rolesAdminApi.asignarPermiso(rolId!, permiso.id),
        onSuccess: () => refrescar(),
    });

    const rol = roles.find((r) => r.id === rolId) ?? null;
    const activos = new Set((delRol.data ?? []).map((rp) => rp.permisoId));
    const grupos = agruparPermisos((permisos.data ?? []).filter((p) => coincide(busqueda, p.nombre, p.descripcion)));
    const bloqueado = (p: Permiso) => rol?.nombre === ROL_ADMIN && p.nombre === PERMISO_ADMIN;

    return (
        <PaginaAdmin>
            <PageHeader title="Roles y Permisos" subtitle="Gestión granular de accesos" action={<Btn size="sm" onClick={() => setNuevoRol(true)}><Plus size={14} />Nuevo Rol</Btn>} />

            {(datos.roles.error || permisos.error) && (
                <div className="mb-4"><Aviso tipo="error">{mensajeError(datos.roles.error ?? permisos.error, 'No se pudieron cargar los roles')}</Aviso></div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Roles</p>
                    {roles.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => setRolId(r.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${rolId === r.id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border hover:bg-muted'}`}
                        >
                            <div>
                                <p className="text-sm font-semibold">{r.nombre}</p>
                                {r.esSistema && <p className="text-xs text-muted-foreground">Sistema</p>}
                            </div>
                            <div className={`w-2 h-2 rounded-full ${r.estado === 'activo' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-3">
                    <Card>
                        {rol && (
                            <div className="flex items-center justify-between mb-4 gap-3">
                                <div>
                                    <h3 className="font-semibold text-foreground">{rol.nombre}</h3>
                                    {rol.esSistema && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Lock size={10} />Rol del sistema</p>}
                                </div>
                                <p className="text-xs text-muted-foreground">{activos.size} de {permisos.data?.length ?? 0} permisos</p>
                            </div>
                        )}
                        <div className="mb-3"><SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar permiso..." /></div>
                        {alternar.error && <div className="mb-3"><Aviso tipo="error">{mensajeError(alternar.error, 'No se pudo cambiar el permiso')}</Aviso></div>}

                        {permisos.isLoading || delRol.isLoading ? (
                            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">Permiso</th>
                                            <th className="text-center py-2 px-2 text-muted-foreground font-semibold w-20">Activo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grupos.map(({ modulo, permisos: lista }) => (
                                            <GrupoPermisos
                                                key={modulo}
                                                modulo={modulo}
                                                lista={lista}
                                                activos={activos}
                                                bloqueado={bloqueado}
                                                ocupado={alternar.isPending}
                                                onAlternar={(permiso, activo) => alternar.mutate({ permiso, activo })}
                                            />
                                        ))}
                                        {grupos.length === 0 && (
                                            <tr><td colSpan={2} className="py-6 text-center text-sm text-muted-foreground">No hay permisos que coincidan</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-4 p-3 bg-[#FFF3E0] border border-amber-200 rounded-xl flex items-start gap-2">
                            <Info size={14} className="text-[#F16C07] shrink-0 mt-0.5" />
                            <p className="text-xs text-[#E65100]">Los cambios se aplican cuando el usuario vuelve a iniciar sesión.</p>
                        </div>
                    </Card>
                </div>
            </div>

            <ModalNuevoRol abierto={nuevoRol} onClose={() => setNuevoRol(false)} onCreado={(id) => { setRolId(id); refrescar(); }} />
        </PaginaAdmin>
    );
};

const GrupoPermisos = ({ modulo, lista, activos, bloqueado, ocupado, onAlternar }: {
    modulo: string; lista: Permiso[]; activos: Set<number>; bloqueado: (p: Permiso) => boolean; ocupado: boolean;
    onAlternar: (permiso: Permiso, activo: boolean) => void;
}) => (
    <>
        <tr className="bg-primary/5">
            <td className="py-2 pr-4 pl-2 text-xs" colSpan={2}><span className="font-semibold text-foreground">{modulo}</span></td>
        </tr>
        {lista.map((p) => {
            const activo = activos.has(p.id);
            const fijo = bloqueado(p);
            return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-2.5 pr-4 pl-4">
                        <p className="font-medium text-foreground">{p.descripcion || p.nombre}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{p.nombre}</p>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                        <button
                            type="button"
                            disabled={fijo || ocupado}
                            title={fijo ? 'El administrador siempre debe poder gestionar usuarios' : undefined}
                            onClick={() => onAlternar(p, activo)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-all ${activo ? 'bg-primary text-white' : 'bg-muted text-muted-foreground border border-border'} ${fijo ? 'cursor-not-allowed opacity-70' : 'hover:opacity-80'}`}
                        >
                            {activo ? <Check size={12} /> : <Minus size={12} />}
                        </button>
                    </td>
                </tr>
            );
        })}
    </>
);

const ModalNuevoRol = ({ abierto, onClose, onCreado }: { abierto: boolean; onClose: () => void; onCreado: (id: number) => void }) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const crear = useMutation({
        mutationFn: async () => (await rolesAdminApi.crear(nombre.trim(), descripcion.trim())).data,
        onSuccess: (rol) => { onCreado(rol.id); cerrar(); },
    });
    function cerrar() {
        setNombre('');
        setDescripcion('');
        crear.reset();
        onClose();
    }
    return (
        <Modal open={abierto} onClose={cerrar} title="Nuevo Rol">
            <div className="space-y-3">
                <Input label="Nombre del rol" value={nombre} onChange={setNombre} required placeholder="Ej: Monitor de campo" />
                <Input label="Descripción" value={descripcion} onChange={setDescripcion} placeholder="Qué hace este rol" />
                <p className="text-xs text-muted-foreground">Después de crearlo, marca los permisos que tendrá.</p>
                {crear.error && <Aviso tipo="error">{mensajeError(crear.error, 'No se pudo crear el rol')}</Aviso>}
                <BotonesModal textoConfirmar="Crear rol" onConfirmar={() => crear.mutate()} onCancelar={cerrar} cargando={crear.isPending} deshabilitado={!nombre.trim()} />
            </div>
        </Modal>
    );
};

export default RolesPermisos;
