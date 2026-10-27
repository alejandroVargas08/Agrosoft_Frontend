import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Clock, GraduationCap, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { Badge, Btn, Card, PageHeader } from '../../components/ui/AgroUI';
import { Aviso, Avatar, PaginaAdmin, RolBadge, TarjetaDato } from '../../components/admin/ComponentesAdmin';
import { mensajeError } from '../../api/errores/errores';
import { useDatosAdmin } from '../../hooks/admin/useDatosAdmin';
import { ROL_ADMIN, ROL_APRENDIZ, ROL_INSTRUCTOR } from '../../types/admin/admin';
import { haceCuanto, nombreCompleto } from '../../utils/admin/admin';

const PanelAdmin = () => {
    const navigate = useNavigate();
    const datos = useDatosAdmin();
    const usuarios = datos.usuarios.data ?? [];
    const fichas = datos.fichas.data ?? [];
    const pendientes = datos.solicitudes.data ?? [];

    const activos = usuarios.filter((u) => u.estado === 'activo');
    const inactivos = usuarios.filter((u) => u.estado === 'inactivo').length;
    const contar = (rol: string) => activos.filter((u) => datos.esRol(u, rol)).length;
    const fichasActivas = fichas.filter((f) => f.estado === 'activo');
    const sinInstructor = fichasActivas.filter((f) => f.instructores.length === 0);
    const sinFicha = activos.filter((u) => datos.esRol(u, ROL_APRENDIZ) && !u.programaFormacionId);
    const ultimosIngresos = [...activos]
        .filter((u) => u.ultimoIngreso)
        .sort((a, b) => (b.ultimoIngreso ?? '').localeCompare(a.ultimoIngreso ?? ''))
        .slice(0, 6);

    const porRol = [ROL_ADMIN, ROL_INSTRUCTOR, ROL_APRENDIZ].map((rol) => ({ rol, total: contar(rol) }));
    const maximo = Math.max(1, ...porRol.map((r) => r.total));

    return (
        <PaginaAdmin>
            <PageHeader title="Panel de administración" subtitle="Usuarios, fichas y solicitudes de AgroSoft" />

            {datos.error && <div className="mb-4"><Aviso tipo="error">{mensajeError(datos.error, 'No se pudo cargar el panel')}</Aviso></div>}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <TarjetaDato
                    icon={UserCheck}
                    label="Solicitudes pendientes"
                    value={datos.solicitudes.isLoading ? '…' : pendientes.length}
                    sub={pendientes.length ? 'Toca para revisarlas' : 'Todo al día'}
                    color={pendientes.length ? 'bg-[#FFF3E0] text-[#F16C07]' : 'bg-emerald-100 text-emerald-700'}
                    onClick={() => navigate('/admin/solicitudes')}
                />
                <TarjetaDato
                    icon={Users}
                    label="Usuarios activos"
                    value={datos.cargando ? '…' : activos.length}
                    sub={`${inactivos} inactivos`}
                    onClick={() => navigate('/admin/usuarios')}
                />
                <TarjetaDato
                    icon={GraduationCap}
                    label="Fichas activas"
                    value={datos.cargando ? '…' : fichasActivas.length}
                    sub={sinInstructor.length ? `${sinInstructor.length} sin instructor` : 'Todas con instructor'}
                    color="bg-blue-100 text-blue-700"
                    onClick={() => navigate('/admin/fichas')}
                />
                <TarjetaDato
                    icon={ShieldCheck}
                    label="Roles"
                    value={datos.roles.isLoading ? '…' : datos.roles.data?.length ?? 0}
                    sub="Permisos por rol"
                    color="bg-purple-100 text-purple-700"
                    onClick={() => navigate('/admin/roles')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-foreground">Solicitudes de acceso</h2>
                        {pendientes.length > 0 && <Badge color="warning">{pendientes.length}</Badge>}
                    </div>
                    {pendientes.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No hay solicitudes pendientes</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {pendientes.slice(0, 5).map((u) => (
                                <button key={u.id} type="button" onClick={() => navigate('/admin/solicitudes')} className="w-full flex items-center justify-between gap-3 py-2.5 text-left hover:bg-muted/40 rounded-lg">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar persona={u} tamano="sm" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{nombreCompleto(u)}</p>
                                            <p className="text-xs text-muted-foreground">{u.solicitud?.rolSolicitado} · {haceCuanto(u.solicitud?.solicitadoEn ?? u.creadoEn).toLowerCase()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                    <Btn variant="outline" className="justify-center" onClick={() => navigate('/admin/solicitudes')}>Ver solicitudes</Btn>
                </Card>

                <Card className="flex flex-col gap-3">
                    <h2 className="font-semibold text-foreground">Usuarios activos por rol</h2>
                    <div className="space-y-3">
                        {porRol.map(({ rol, total }) => (
                            <div key={rol} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <RolBadge nombre={rol} />
                                    <span className="font-semibold text-foreground">{total}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(total / maximo) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {sinFicha.length > 0 && (
                        <Aviso tipo="alerta">
                            {sinFicha.length} aprendiz{sinFicha.length === 1 ? '' : 'es'} sin ficha. No verán los lotes de ninguna ficha.{' '}
                            <button type="button" className="font-semibold underline" onClick={() => navigate('/admin/usuarios')}>Revisar</button>
                        </Aviso>
                    )}
                </Card>

                <Card className="flex flex-col gap-3">
                    <h2 className="font-semibold text-foreground">Fichas sin instructor</h2>
                    {sinInstructor.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Todas las fichas activas tienen instructor</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {sinInstructor.slice(0, 5).map((f) => (
                                <div key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground">Ficha {f.ficha}</p>
                                        <p className="text-xs text-muted-foreground truncate">{f.nombre} · {f.totalAprendices} aprendices</p>
                                    </div>
                                    <AlertTriangle size={16} className="text-[#F16C07] shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                    <Btn variant="outline" className="justify-center" onClick={() => navigate('/admin/fichas')}>Ir a fichas</Btn>
                </Card>

                <Card className="flex flex-col gap-3">
                    <h2 className="font-semibold text-foreground">Últimos ingresos</h2>
                    {ultimosIngresos.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Aún no hay ingresos registrados</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {ultimosIngresos.map((u) => (
                                <div key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar persona={u} tamano="sm" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{nombreCompleto(u)}</p>
                                            <p className="text-xs text-muted-foreground">{datos.rolDe(u)}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0"><Clock size={12} />{haceCuanto(u.ultimoIngreso)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </PaginaAdmin>
    );
};

export default PanelAdmin;
