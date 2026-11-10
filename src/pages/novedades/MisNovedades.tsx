import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Leaf, Package, Plus, Wrench } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Btn, Card, EmptyState, Modal, PageHeader, Select, StatusBadge, Textarea } from '../../components/ui/AgroUI';
import { useMisNovedades } from '../../hooks/novedades/useMisNovedades';
import type { TipoNovedad, UrgenciaNovedad } from '../../types/novedades';

// El diseño muestra cada tipo con una descripción secundaria debajo
const TIPOS: { valor: TipoNovedad; etiqueta: string; descripcion: string; icono: typeof Package }[] = [
    { valor: 'insumo_bajo', etiqueta: 'Insumo por acabarse', descripcion: 'Producto próximo a agotarse', icono: Package },
    { valor: 'herramienta_danada', etiqueta: 'Herramienta dañada', descripcion: 'Equipo dañado o perdido', icono: Wrench },
    { valor: 'problema_cultivo', etiqueta: 'Problema en el cultivo', descripcion: 'Enfermedad, plaga u otro', icono: Leaf },
    { valor: 'otro', etiqueta: 'Otro', descripcion: 'Cualquier otra novedad', icono: AlertCircle },
];

const URGENCIAS: { valor: UrgenciaNovedad; etiqueta: string }[] = [
    { valor: 'low', etiqueta: 'Baja' },
    { valor: 'medium', etiqueta: 'Media' },
    { valor: 'high', etiqueta: 'Alta' },
];

/**
 * El diseño muestra el tiempo relativo, no la fecha, y solo en tres formas:
 * "Hace un momento" por debajo de la hora, "Hace Xh" el mismo día y "Hace Xd".
 */
const hace = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const horas = Math.floor(ms / 3_600_000);
    if (horas < 1) return 'Hace un momento';
    if (horas < 24) return 'Hace ' + horas + 'h';
    return 'Hace ' + Math.floor(ms / 86_400_000) + 'd';
};

const MisNovedades = () => {
    const {
        novedades, consumibles, herramientas, tareas,
        abierto, abrir, cerrar, cargando, error, errorEnvio, enviando, reportar,
    } = useMisNovedades();

    // El boton "Reportar novedad" del topbar llega aqui con ?reportar=1
    const [searchParams, setSearchParams] = useSearchParams();
    const pedirReporte = searchParams.get('reportar') === '1';

    useEffect(() => {
        if (!pedirReporte) return;
        abrir();
        setSearchParams({}, { replace: true });
    }, [pedirReporte, abrir, setSearchParams]);

    // El diseño arranca sin tipo elegido
    const [tipo, setTipo] = useState<TipoNovedad | ''>('');
    const [urgencia, setUrgencia] = useState<UrgenciaNovedad>('medium');
    const [descripcion, setDescripcion] = useState('');
    const [insumoId, setInsumoId] = useState('');
    const [herramientaId, setHerramientaId] = useState('');
    const [tareaId, setTareaId] = useState('');

    const cerrarModal = () => {
        cerrar();
        setTipo('');
        setUrgencia('medium');
        setDescripcion('');
        setInsumoId('');
        setHerramientaId('');
        setTareaId('');
    };

    // El backend exige el insumo cuando es "insumo_bajo" y el nombre cuando es "herramienta_danada"
    const nombreHerramienta = herramientas.find((h) => String(h.id) === herramientaId)?.nombre ?? '';

    const faltaInsumo = tipo === 'insumo_bajo' && insumoId === '';
    const faltaHerramienta = tipo === 'herramienta_danada' && nombreHerramienta === '';
    const completo =
        tipo !== '' &&
        descripcion.trim().length >= 10 &&
        !faltaInsumo &&
        !faltaHerramienta;

    const enviar = () => {
        if (tipo === '' || !completo) return;
        reportar({
            tipo,
            urgencia,
            descripcion: descripcion.trim(),
            ...(tipo === 'insumo_bajo' ? { insumoId: Number(insumoId) } : {}),
            ...(tipo === 'herramienta_danada' ? { nombreHerramienta } : {}),
            ...(tareaId ? { actividadId: Number(tareaId) } : {}),
        }, cerrarModal);
    };

    const botonReportar = (
        <Btn onClick={abrir}><Plus size={16} />Reportar novedad</Btn>
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <PageHeader
                    title="Mis novedades"
                    subtitle="Novedades que has reportado"
                    action={botonReportar}
                />

                {(error || errorEnvio) && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error || errorEnvio}
                    </div>
                )}

                {cargando ? (
                    <p className="text-sm text-muted-foreground">Cargando tus novedades...</p>
                ) : novedades.length === 0 ? (
                    <EmptyState
                        icon={AlertCircle}
                        title="Sin novedades reportadas"
                        description="Aquí aparecerán las novedades que reportes a tu instructor."
                        action={<Btn onClick={abrir}><Plus size={14} />Reportar novedad</Btn>}
                    />
                ) : (
                    <div className="space-y-3">
                        {novedades.map((n) => {
                            const meta = TIPOS.find((t) => t.valor === n.tipo) ?? TIPOS[3];
                            const Icono = meta.icono;
                            return (
                                <Card key={n.id}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-icon-bg rounded-lg">
                                                <Icono size={16} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{meta.etiqueta}</p>
                                                <p className="text-xs text-muted-foreground">{hace(n.creadoEn)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge status={n.estado} />
                                            <StatusBadge status={n.urgencia} />
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-2">{n.descripcion}</p>

                                    {n.respuestaInstructor && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                            <p className="text-xs font-semibold text-emerald-700 mb-0.5">
                                                Respuesta del instructor:
                                            </p>
                                            <p className="text-xs text-emerald-600">{n.respuestaInstructor}</p>
                                            {n.respondidaEn && (
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {hace(n.respondidaEn)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Modal open={abierto} onClose={cerrarModal} title="Reportar novedad">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-foreground mb-2 block">Tipo de novedad</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPOS.map((t) => {
                                const Icono = t.icono;
                                const activo = tipo === t.valor;
                                return (
                                    <button
                                        key={t.valor}
                                        type="button"
                                        onClick={() => setTipo(t.valor)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                                            activo ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                                        }`}
                                    >
                                        <Icono size={18} className={activo ? 'text-primary' : 'text-muted-foreground'} />
                                        <div>
                                            <p className="text-xs font-semibold text-foreground">{t.etiqueta}</p>
                                            <p className="text-[10px] text-muted-foreground">{t.descripcion}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {tipo === 'insumo_bajo' && (
                        <Select
                            label="Insumo"
                            value={insumoId}
                            onChange={setInsumoId}
                            options={[
                                { value: '', label: 'Seleccionar insumo...' },
                                ...consumibles.map((i) => ({
                                    value: String(i.id),
                                    label: i.nombre + ' · ' + i.stockDisponible + ' ' + i.unidadUso + ' disponibles',
                                })),
                            ]}
                        />
                    )}

                    {tipo === 'herramienta_danada' && (
                        <Select
                            label="Herramienta"
                            value={herramientaId}
                            onChange={setHerramientaId}
                            options={[
                                { value: '', label: 'Seleccionar herramienta...' },
                                ...herramientas.map((h) => ({ value: String(h.id), label: h.nombre })),
                            ]}
                        />
                    )}

                    <Textarea
                        label="Descripción"
                        value={descripcion}
                        onChange={setDescripcion}
                        placeholder="Describe la novedad con el mayor detalle posible..."
                        rows={3}
                    />

                    <div>
                        <label className="text-sm font-semibold text-foreground mb-2 block">Urgencia</label>
                        <div className="flex gap-2">
                            {URGENCIAS.map((u) => (
                                <button
                                    key={u.valor}
                                    type="button"
                                    onClick={() => setUrgencia(u.valor)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border ${
                                        urgencia === u.valor
                                            ? 'bg-primary text-white border-primary'
                                            : 'border-border bg-white text-foreground hover:bg-muted'
                                    }`}
                                >
                                    {u.etiqueta}
                                </button>
                            ))}
                        </div>
                    </div>

                    {tareas.length > 0 && (
                        <Select
                            label="Tarea relacionada (opcional)"
                            value={tareaId}
                            onChange={setTareaId}
                            options={[
                                { value: '', label: 'Ninguna' },
                                ...tareas.map((t) => ({ value: String(t.id), label: t.nombre })),
                            ]}
                        />
                    )}

                    <Btn onClick={enviar} disabled={!completo || enviando} className="w-full justify-center">
                        {enviando ? 'Enviando...' : 'Enviar novedad'}
                    </Btn>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default MisNovedades;