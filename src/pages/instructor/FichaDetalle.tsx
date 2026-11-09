import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, ClipboardList, Copy, ExternalLink, GraduationCap, Key, MapPin, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Modal, PageHeader, SearchBar, StatCard, StatusBadge, Tab } from '../../components/ui/AgroUI';
import { useFichaDetalle } from '../../hooks/instructor/useFichaDetalle';

const PESTANAS = ['Aprendices', 'Actividades', 'Lotes'];

const COLUMNAS = ['Aprendiz', 'Correo', 'Tareas', 'Aprobadas', 'Vencidas', 'Horas', 'Último ingreso', 'Acciones'];

const fecha = (valor: string | null) =>
    valor ? new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Nunca';

const FichaDetalle = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const fichaId = Number(id);
    const [pestana, setPestana] = useState(PESTANAS[0]);
    const [codigoAbierto, setCodigoAbierto] = useState(false);
    const [copiado, setCopiado] = useState(false);

    const {
        ficha, aprendices, actividades, totales, lotes, busqueda, setBusqueda,
        codigo, cargandoCodigo, generandoCodigo, generarCodigo, errorCodigo,
        cargando, error, fichaNoEncontrada,
    } = useFichaDetalle(fichaId);

    /** Usa el compartir del sistema si lo hay; si no, deja el código copiado. */
    const compartir = () => {
        if (!codigo) return;
        const texto = 'Regístrate en AgroSoft con el código de invitación ' + codigo.codigo;
        if (navigator.share) {
            void navigator.share({ text: texto }).catch(() => {});
            return;
        }
        navigator.clipboard?.writeText(texto);
        setCopiado(true);
        window.setTimeout(() => setCopiado(false), 2000);
    };

    const copiar = () => {
        if (!codigo) return;
        navigator.clipboard?.writeText(codigo.codigo);
        setCopiado(true);
        window.setTimeout(() => setCopiado(false), 2000);
    };

    if (fichaNoEncontrada) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <EmptyState
                        icon={GraduationCap}
                        title="Ficha no encontrada"
                        description="No existe, o no está entre las fichas a tu cargo."
                        action={<Btn variant="outline" onClick={() => navigate('/mis-fichas')}>Volver a mis fichas</Btn>}
                    />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title={ficha ? 'Ficha ' + ficha.ficha : 'Ficha'}
                    subtitle={ficha?.nombre}
                    onBack={() => navigate('/mis-fichas')}
                    action={
                        <Btn variant="outline" onClick={() => setCodigoAbierto(true)}>
                            <Key size={14} />Código de invitación
                        </Btn>
                    }
                />

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <StatCard icon={Users} label="Aprendices" value={totales.aprendices} color="primary" />
                    <StatCard icon={ClipboardList} label="Tareas activas" value={totales.tareasActivas} color="blue" />
                    <StatCard icon={CheckCircle} label="Por revisar" value={totales.porRevisar} color="amber" />
                    <StatCard icon={AlertCircle} label="Novedades" value={totales.novedades} color="red" />
                </div>

                <Tab tabs={PESTANAS} active={pestana} onChange={setPestana} />

                {pestana === 'Aprendices' && (
                    <div>
                        <div className="mb-3">
                            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar aprendiz..." />
                        </div>

                        {cargando ? (
                            <p className="py-16 text-center text-sm text-muted-foreground">Cargando aprendices...</p>
                        ) : aprendices.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                title={totales.aprendices === 0 ? 'Sin aprendices' : 'Nadie con esa búsqueda'}
                                description={
                                    totales.aprendices === 0
                                        ? 'Cuando se registren aprendices con esta ficha, aparecerán aquí.'
                                        : 'Prueba con otro nombre, correo o documento.'
                                }
                            />
                        ) : (
                            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[700px]">
                                        <thead>
                                            <tr className="bg-muted border-b border-border">
                                                {COLUMNAS.map((col) => (
                                                    <th
                                                        key={col}
                                                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aprendices.map((a, i) => (
                                                <tr
                                                    key={a.id}
                                                    className={
                                                        'border-b border-border last:border-0 hover:bg-muted/20 ' +
                                                        (i % 2 === 0 ? 'bg-white' : 'bg-muted/10')
                                                    }
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                                {a.nombre.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-medium">
                                                                {a.nombre} {a.apellido}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.correo}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-center">{a.tareas}</td>
                                                    <td className="px-4 py-3 text-sm text-center">
                                                        <span className="text-chip-bg font-bold">{a.aprobadas}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center">
                                                        <span className={a.vencidas > 0 ? 'text-red-600 font-bold' : 'text-muted-foreground'}>
                                                            {a.vencidas}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-center">{a.horas}h</td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                        {fecha(a.ultimoIngreso)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1">
                                                            <Btn variant="outline" size="sm" onClick={() => navigate('/aprendices/' + a.id)}>
                                                                Ver
                                                            </Btn>
                                                            <Btn size="sm" onClick={() => navigate('/actividades')}>
                                                                Asignar
                                                            </Btn>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {pestana === 'Actividades' && (
                    actividades.length === 0 ? (
                        <EmptyState
                            icon={ClipboardList}
                            title="Sin actividades asignadas"
                            description="Cuando le asignes una actividad a alguien de esta ficha, el avance del grupo aparece aquí."
                        />
                    ) : (
                        <div className="space-y-3">
                            {actividades.map((actividad) => (
                                <Card key={actividad.actividadId}>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <p className="font-semibold text-foreground truncate">{actividad.actividad}</p>
                                        <StatusBadge status={actividad.estado} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-muted rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-primary transition-all"
                                                style={{ width: (actividad.aprobadas / actividad.total) * 100 + '%' }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {actividad.aprobadas}/{actividad.total} aprobadas
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )
                )}

                {pestana === 'Lotes' && (
                    lotes.length === 0 ? (
                        <EmptyState
                            icon={MapPin}
                            title="Sin lotes asignados a la ficha"
                            description="Un lote pertenece a una ficha por su programa de formación. Los que no tienen ficha los ve todo el mundo y no salen aquí."
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {lotes.map((lote) => (
                                <Card key={lote.id}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-icon-bg rounded-lg">
                                            <MapPin size={16} className="text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate">{lote.nombre}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {lote.areaHa} ha{lote.descripcion ? ' · ' + lote.descripcion : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={lote.estado} />
                                </Card>
                            ))}
                        </div>
                    )
                )}

                <Modal open={codigoAbierto} onClose={() => setCodigoAbierto(false)} title="Código de invitación">
                    <div className="text-center space-y-4">
                        {errorCodigo && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {errorCodigo}
                            </div>
                        )}

                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                            {cargandoCodigo ? (
                                <p className="text-sm text-muted-foreground">Cargando...</p>
                            ) : codigo ? (
                                <p className="text-4xl font-bold font-mono text-primary tracking-widest">{codigo.codigo}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Esta ficha todavía no tiene código. Genera uno para que tus aprendices se registren directamente en ella.
                                </p>
                            )}
                        </div>

                        {codigo && (
                            <>
                                <p className="text-xs text-muted-foreground">Vence el {fecha(codigo.expiraEn)}</p>
                                <div className="flex gap-2">
                                    <Btn onClick={copiar} className="flex-1 justify-center">
                                        <Copy size={14} />{copiado ? 'Copiado' : 'Copiar'}
                                    </Btn>
                                    <Btn variant="outline" onClick={compartir} className="flex-1 justify-center">
                                        <ExternalLink size={14} />Compartir
                                    </Btn>
                                </div>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={generarCodigo}
                            disabled={generandoCodigo}
                            className="text-sm text-destructive hover:underline disabled:opacity-50"
                        >
                            {generandoCodigo
                                ? 'Generando...'
                                : codigo
                                    ? 'Generar nuevo código'
                                    : 'Generar código'}
                        </button>

                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default FichaDetalle;
