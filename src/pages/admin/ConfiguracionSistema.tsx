import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { HardDrive, Info, Shield, Wifi } from 'lucide-react';
import { Btn, Card, Input, PageHeader, Select, Tab } from '../../components/ui/AgroUI';
import { Aviso, PaginaAdmin } from '../../components/admin/ComponentesAdmin';
import { iotConfigApi, lotesAdminApi } from '../../api/admin/admin';
import { mensajeError } from '../../api/errores/errores';
import type { ConfigIot } from '../../types/admin/admin';

const PESTANAS = ['General', 'Seguridad', 'IoT / MQTT', 'Almacenamiento'];

const MEDICIONES = [
    { sensor: 'DHT22', medicion: 'Temperatura', unidad: '°C', min: '10', max: '35' },
    { sensor: 'DHT22', medicion: 'Humedad', unidad: '%', min: '40', max: '80' },
    { sensor: 'UVM-30A', medicion: 'Índice UV', unidad: 'UV', min: '0', max: '6' },
    { sensor: 'BH1750 / LDR', medicion: 'Luminosidad', unidad: 'lx', min: '1000', max: '80000' },
];

const Fila = ({ etiqueta, valor, ultima = false }: { etiqueta: string; valor: string; ultima?: boolean }) => (
    <div className={`flex justify-between py-1.5 ${ultima ? '' : 'border-b border-border'}`}>
        <span className="text-muted-foreground">{etiqueta}</span>
        <span className="font-medium text-right">{valor}</span>
    </div>
);

const ConfiguracionSistema = () => {
    const [pestana, setPestana] = useState('General');
    return (
        <PaginaAdmin>
            <PageHeader title="Configuración del Sistema" subtitle="Parámetros globales de AgroSoft" />
            <Tab tabs={PESTANAS} active={pestana} onChange={setPestana} />

            {pestana === 'General' && (
                <div className="max-w-2xl space-y-4">
                    <Card>
                        <h3 className="font-semibold text-foreground mb-3">Información del sistema</h3>
                        <div className="space-y-2 text-sm">
                            <Fila etiqueta="Sistema" valor="AgroSoft" />
                            <Fila etiqueta="Entidad" valor="SENA Colombia" />
                            <Fila etiqueta="Base de datos" valor="PostgreSQL + PostGIS" />
                            <Fila etiqueta="Servidor" valor={import.meta.env.VITE_API_URL ?? '—'} ultima />
                        </div>
                    </Card>
                </div>
            )}

            {pestana === 'Seguridad' && (
                <div className="max-w-2xl">
                    <Card>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-primary/10 rounded-lg"><Shield size={18} className="text-primary" /></div>
                            <h3 className="font-semibold text-foreground">Sesión y seguridad</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <Fila etiqueta="Inicio de sesión" valor="Correo y contraseña (JWT)" />
                            <Fila etiqueta="Recuperación de contraseña" valor="Código enviado al correo" />
                            <Fila etiqueta="Instructores y administradores" valor="Requieren aprobación" />
                            <Fila etiqueta="Código de registro de instructor" valor="CODIGO_REGISTRO_INSTRUCTOR" ultima />
                        </div>
                        <div className="mt-3"><Aviso>Estos parámetros se configuran en el archivo .env del backend.</Aviso></div>
                    </Card>
                </div>
            )}

            {pestana === 'IoT / MQTT' && <PestanaIot />}

            {pestana === 'Almacenamiento' && (
                <div className="max-w-2xl">
                    <Card>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-primary/10 rounded-lg"><HardDrive size={18} className="text-primary" /></div>
                            <h3 className="font-semibold text-foreground">Archivos y multimedia</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <Fila etiqueta="Imágenes de drones" valor="Carpeta storage del backend" />
                            <Fila etiqueta="Evidencias de actividades" valor="Carpeta storage del backend" />
                            <Fila etiqueta="Formatos permitidos" valor="jpg, png, webp" ultima />
                        </div>
                        <div className="mt-3"><Aviso>La carpeta storage no se sube a Git. Haz copia de seguridad de ella junto con la base de datos.</Aviso></div>
                    </Card>
                </div>
            )}
        </PaginaAdmin>
    );
};

const PestanaIot = () => {
    const configs = useQuery({ queryKey: ['admin', 'iot-config'], queryFn: async () => (await iotConfigApi.listar()).data });
    const lotes = useQuery({ queryKey: ['admin', 'lotes'], queryFn: async () => (await lotesAdminApi.listar()).data });
    const broker = configs.data?.[0] ?? null;

    const [host, setHost] = useState('');
    const [puerto, setPuerto] = useState('1883');
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [prefijo, setPrefijo] = useState('agrosoft');
    const [nombreEstacion, setNombreEstacion] = useState('');
    const [loteId, setLoteId] = useState('');
    const [mensaje, setMensaje] = useState<string | null>(null);

    useEffect(() => {
        if (!broker) return;
        setHost(broker.agente);
        setPuerto(String(broker.puerto));
        setUsuario(broker.nombreUsuario);
        setPrefijo(broker.prefijoTema);
    }, [broker]);

    const slug = nombreEstacion.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'nueva-estacion';
    const tema = `${prefijo || 'agrosoft'}/${slug}`;

    const guardarBroker = useMutation({
        mutationFn: async () => {
            const cambios = {
                agente: host.trim(),
                puerto: Number(puerto),
                nombreUsuario: usuario.trim(),
                prefijoTema: prefijo.trim(),
                ...(contrasena ? { contrasena } : {}),
            };
            for (const c of configs.data ?? []) await iotConfigApi.actualizar(c.id, cambios);
        },
        onSuccess: () => { setMensaje('Configuración IoT guardada'); configs.refetch(); },
    });

    const registrar = useMutation({
        mutationFn: () => iotConfigApi.crear({
            nombre: nombreEstacion.trim(),
            agente: host.trim(),
            puerto: Number(puerto),
            protocolo: broker?.protocolo ?? 'mqtt',
            nombreUsuario: usuario.trim(),
            contrasena,
            prefijoTema: prefijo.trim(),
            loteId: Number(loteId),
        }),
        onSuccess: () => {
            setMensaje(`Estación "${nombreEstacion}" registrada`);
            setNombreEstacion('');
            setLoteId('');
            configs.refetch();
        },
    });

    const nombreLote = (c: ConfigIot) => (lotes.data ?? []).find((l) => l.id === c.loteId)?.nombre ?? 'Sin lote';
    const puertoValido = Number(puerto) > 0 && Number(puerto) <= 65535;

    return (
        <div className="max-w-2xl space-y-4">
            {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
            {configs.error && <Aviso tipo="error">{mensajeError(configs.error, 'No se pudo cargar la configuración IoT')}</Aviso>}

            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg"><Wifi size={18} className="text-blue-600" /></div>
                    <div>
                        <h3 className="font-semibold text-foreground">Broker MQTT</h3>
                        <p className="text-xs text-muted-foreground">Parámetros de conexión con el servidor MQTT</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${broker?.activo ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                        <span className={`text-xs font-semibold ${broker?.activo ? 'text-emerald-700' : 'text-muted-foreground'}`}>{broker ? (broker.activo ? 'Activo' : 'Inactivo') : 'Sin configurar'}</span>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2"><Input label="Host" value={host} onChange={setHost} placeholder="broker.ejemplo.com" /></div>
                        <Input label="Puerto" value={puerto} onChange={setPuerto} type="number" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Usuario" value={usuario} onChange={setUsuario} />
                        <Input label="Contraseña" value={contrasena} onChange={setContrasena} type="password" placeholder={broker ? 'Sin cambios' : ''} />
                    </div>
                    <Input label="Prefijo de temas" value={prefijo} onChange={setPrefijo} placeholder="agrosoft" />
                    <div className="p-3 bg-muted rounded-xl text-xs space-y-1">
                        <p className="font-semibold text-foreground mb-1.5">Estaciones registradas:</p>
                        {configs.isLoading && <p className="text-muted-foreground">Cargando...</p>}
                        {!configs.isLoading && (configs.data ?? []).length === 0 && <p className="text-muted-foreground">Aún no hay estaciones</p>}
                        {(configs.data ?? []).map((c) => (
                            <div key={c.id} className="flex items-center gap-2 flex-wrap">
                                <div className={`w-1.5 h-1.5 rounded-full ${c.activo ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                                <span className="text-muted-foreground">{c.nombre} · {nombreLote(c)}</span>
                                <span className="font-mono text-primary">{c.prefijoTema}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg"><Wifi size={18} className="text-primary" /></div>
                    <div>
                        <h3 className="font-semibold text-foreground">Registrar nueva estación</h3>
                        <p className="text-xs text-muted-foreground">Configure los datos básicos de una nueva estación IoT</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <Input label="Nombre de la estación" value={nombreEstacion} onChange={setNombreEstacion} placeholder="Ej. Estación Lote 4" />
                    <Select
                        label="Lote"
                        value={loteId}
                        onChange={setLoteId}
                        options={[{ value: '', label: 'Seleccionar lote...' }, ...(lotes.data ?? []).map((l) => ({ value: String(l.id), label: l.nombre }))]}
                    />
                    <div>
                        <Input label="Tema MQTT" value={tema} onChange={() => {}} />
                        <p className="text-xs text-muted-foreground mt-1">Generado automáticamente a partir del prefijo y el nombre</p>
                    </div>
                    <div className="mt-2">
                        <p className="text-sm font-semibold text-foreground mb-2">Mediciones configuradas</p>
                        <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Sensor</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Medición</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Unidad</th>
                                        <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Mín.</th>
                                        <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Máx.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {MEDICIONES.map((m) => (
                                        <tr key={m.medicion} className="bg-background">
                                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{m.sensor}</td>
                                            <td className="px-3 py-2 font-medium text-foreground">{m.medicion}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{m.unidad}</td>
                                            <td className="px-3 py-2 text-right text-muted-foreground">{m.min}</td>
                                            <td className="px-3 py-2 text-right text-muted-foreground">{m.max}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">Los rangos se pueden ajustar por estación desde la pantalla de Sensores.</p>
                    </div>
                    {!contrasena && <p className="text-xs text-[#E65100] flex items-center gap-1"><Info size={12} />Escribe la contraseña del broker arriba para registrar la estación.</p>}
                    {registrar.error && <Aviso tipo="error">{mensajeError(registrar.error, 'No se pudo registrar la estación')}</Aviso>}
                    <div className="pt-1">
                        <Btn
                            onClick={() => registrar.mutate()}
                            disabled={!nombreEstacion.trim() || !loteId || !host.trim() || !usuario.trim() || contrasena.length < 4 || !puertoValido || registrar.isPending}
                        >
                            {registrar.isPending ? 'Registrando...' : 'Registrar estación'}
                        </Btn>
                    </div>
                </div>
            </Card>

            {guardarBroker.error && <Aviso tipo="error">{mensajeError(guardarBroker.error, 'No se pudo guardar la configuración IoT')}</Aviso>}
            <div className="flex gap-3">
                <Btn onClick={() => guardarBroker.mutate()} disabled={!broker || !host.trim() || !usuario.trim() || !puertoValido || guardarBroker.isPending}>
                    {guardarBroker.isPending ? 'Guardando...' : 'Guardar configuración'}
                </Btn>
                <Btn variant="outline" onClick={() => { setMensaje(null); configs.refetch(); }}>Actualizar</Btn>
            </div>
        </div>
    );
};

export default ConfiguracionSistema;
