import { useState } from 'react';
import { Check, Info, Lock, Minus, Plus, Shield } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Input, Modal, PageHeader } from '../../components/ui/AgroUI';
import { useRolesPermisos } from '../../hooks/admin/useRolesPermisos';

const RolesPermisos = () => {
    const {
        roles, rolSeleccionado, seleccionar, grupos, tienePermiso, bloqueado, esMiRol,
        cargando, cargandoPermisosDelRol, error, errorAccion, procesando, alternar, crearRol,
    } = useRolesPermisos();

    const [formAbierto, setFormAbierto] = useState(false);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const guardar = () => {
        if (!nombre.trim()) return;
        crearRol(nombre, descripcion, () => {
            setFormAbierto(false);
            setNombre('');
            setDescripcion('');
        });
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Roles y permisos"
                    subtitle="Qué puede hacer cada rol"
                    action={
                        <Btn size="sm" onClick={() => setFormAbierto(true)}>
                            <Plus size={14} />Nuevo rol
                        </Btn>
                    }
                />

                {(error || errorAccion) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorAccion}
                    </div>
                )}

                {cargando ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Cargando...</p>
                ) : roles.length === 0 ? (
                    <EmptyState icon={Shield} title="Sin roles" description="Todavía no hay roles registrados." />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Roles
                            </p>
                            {roles.map((rol) => (
                                <button
                                    key={rol.id}
                                    type="button"
                                    onClick={() => seleccionar(rol.id)}
                                    className={
                                        'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ' +
                                        (rolSeleccionado?.id === rol.id
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : 'bg-card border-border hover:bg-muted')
                                    }
                                >
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold truncate">{rol.nombre}</span>
                                        {rol.esSistema && (
                                            <span className="block text-xs text-muted-foreground">Sistema</span>
                                        )}
                                    </span>
                                    <span
                                        className={
                                            'w-2 h-2 rounded-full shrink-0 ' +
                                            (rol.estado === 'activo' ? 'bg-emerald-500' : 'bg-muted-foreground')
                                        }
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="lg:col-span-3">
                            <Card>
                                <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
                                    <div>
                                        <h3 className="font-semibold text-foreground">{rolSeleccionado?.nombre}</h3>
                                        {rolSeleccionado?.descripcion && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {rolSeleccionado.descripcion}
                                            </p>
                                        )}
                                    </div>
                                    {esMiRol && (
                                        <span className="text-xs text-[#E65100] font-medium">Es tu rol</span>
                                    )}
                                </div>

                                {rolSeleccionado?.esSistema && (
                                    <div className="mb-4 p-3 bg-[#FFF3E0] border border-amber-200 rounded-xl flex items-start gap-2">
                                        <Lock size={14} className="text-[#F16C07] shrink-0 mt-0.5" />
                                        <p className="text-xs text-[#E65100]">
                                            Es un rol del sistema. Puedes cambiarlo, pero el cambio afecta a todos los
                                            usuarios que lo tengan.
                                        </p>
                                    </div>
                                )}

                                {cargandoPermisosDelRol ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        Cargando permisos...
                                    </p>
                                ) : grupos.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No hay permisos registrados en la base de datos.
                                    </p>
                                ) : (
                                    <div className="space-y-5">
                                        {grupos.map((grupo) => (
                                            <div key={grupo.modulo}>
                                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 capitalize">
                                                    {grupo.modulo}
                                                </p>
                                                <div className="space-y-1">
                                                    {grupo.permisos.map((permiso) => {
                                                        const tiene = tienePermiso(permiso);
                                                        const motivo = bloqueado(permiso);
                                                        return (
                                                            <button
                                                                key={permiso.id}
                                                                type="button"
                                                                disabled={procesando || motivo !== null}
                                                                title={motivo ?? undefined}
                                                                onClick={() => alternar(permiso)}
                                                                className={
                                                                    'w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ' +
                                                                    (motivo !== null
                                                                        ? 'opacity-60 cursor-not-allowed bg-muted/40'
                                                                        : 'hover:bg-muted/60')
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        'w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all ' +
                                                                        (tiene
                                                                            ? 'bg-primary text-white'
                                                                            : 'bg-muted text-muted-foreground border border-border')
                                                                    }
                                                                >
                                                                    {tiene ? <Check size={12} /> : <Minus size={12} />}
                                                                </span>
                                                                <span className="min-w-0">
                                                                    <span className="block text-sm font-medium font-mono text-foreground">
                                                                        {permiso.nombre}
                                                                    </span>
                                                                    {permiso.descripcion && (
                                                                        <span className="block text-xs text-muted-foreground">
                                                                            {permiso.descripcion}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-4 p-3 bg-muted/50 border border-border rounded-xl flex items-start gap-2">
                                    <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground">
                                        Cada cambio se guarda al instante. Los usuarios con este rol lo notan cuando
                                        vuelven a iniciar sesión, porque los permisos se resuelven al entrar.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                <Modal open={formAbierto} onClose={() => setFormAbierto(false)} title="Nuevo rol">
                    <div className="space-y-3">
                        <Input label="Nombre" value={nombre} onChange={setNombre} required placeholder="Ej: Coordinador" />
                        <Input label="Descripción" value={descripcion} onChange={setDescripcion} placeholder="Para qué sirve este rol" />
                        <p className="text-xs text-muted-foreground">
                            El rol nace sin permisos. Se los asignas después desde esta misma pantalla.
                        </p>
                        <div className="flex gap-3 pt-1">
                            <Btn disabled={procesando || !nombre.trim()} onClick={guardar} className="flex-1 justify-center">
                                {procesando ? 'Guardando...' : 'Crear rol'}
                            </Btn>
                            <Btn variant="outline" onClick={() => setFormAbierto(false)} className="flex-1 justify-center">
                                Cancelar
                            </Btn>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default RolesPermisos;
