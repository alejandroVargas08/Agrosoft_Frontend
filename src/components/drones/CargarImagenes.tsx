import { useRef, useState } from 'react';
import { CheckCircle2, FileImage, Loader2, UploadCloud, X, XCircle } from 'lucide-react';
import { Btn } from '../ui/AgroUI';
import { vuelosApi } from '../../api/drones/drones';
import { mensajeError } from '../../api/errores/errores';
import type { ResultadoCarga } from '../../types/drones/drones';
import { bandaDelArchivo, dividirEnLotes, tamanoLegible, validarArchivo } from '../../utils/drones/drones';

type EstadoArchivo = 'pendiente' | 'subiendo' | 'aceptado' | 'rechazado';

interface ArchivoEnCola {
    clave: string;
    archivo: File;
    estado: EstadoArchivo;
    motivo?: string;
}

interface Props {
    vueloId: number;
    bloqueado: boolean;
    motivoBloqueo?: string;
    alTerminar: (resumen: ResultadoCarga) => void;
}

const claveDe = (archivo: File) => `${archivo.name}-${archivo.size}-${archivo.lastModified}`;

const CargaImagenes = ({ vueloId, bloqueado, motivoBloqueo, alTerminar }: Props) => {
    const entrada = useRef<HTMLInputElement>(null);
    const [cola, setCola] = useState<ArchivoEnCola[]>([]);
    const [arrastrando, setArrastrando] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [loteActual, setLoteActual] = useState({ actual: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);
    const [resumen, setResumen] = useState<ResultadoCarga | null>(null);

    const agregar = (lista: FileList | null) => {
        if (!lista || bloqueado || subiendo) return;
        setResumen(null);
        setError(null);
        setCola((previa) => {
            const existentes = new Set(previa.map((a) => a.clave));
            const nuevos: ArchivoEnCola[] = [];
            for (const archivo of Array.from(lista)) {
                const clave = claveDe(archivo);
                if (existentes.has(clave)) continue;
                existentes.add(clave);
                const motivo = validarArchivo(archivo);
                nuevos.push({ clave, archivo, estado: motivo ? 'rechazado' : 'pendiente', motivo: motivo ?? undefined });
            }
            return [...previa.filter((a) => a.estado !== 'aceptado'), ...nuevos];
        });
    };

    const quitar = (clave: string) => setCola((previa) => previa.filter((a) => a.clave !== clave));

    const marcar = (claves: Set<string>, estado: EstadoArchivo, motivos: Map<string, string> = new Map()) =>
        setCola((previa) =>
            previa.map((a) => {
                if (!claves.has(a.clave)) return a;
                const motivo = motivos.get(a.archivo.name);
                return motivo ? { ...a, estado: 'rechazado', motivo } : { ...a, estado, motivo: undefined };
            }),
        );

    const subir = async () => {
        const pendientes = cola.filter((a) => a.estado === 'pendiente');
        if (pendientes.length === 0) return;
        const lotes = dividirEnLotes(pendientes.map((a) => a.archivo));
        const bytesTotales = pendientes.reduce((suma, a) => suma + a.archivo.size, 0);
        let bytesEnviados = 0;
        let acumulado: ResultadoCarga | null = null;

        setSubiendo(true);
        setError(null);
        setProgreso(0);

        try {
            for (let i = 0; i < lotes.length; i++) {
                const lote = lotes[i];
                const claves = new Set(lote.map(claveDe));
                const bytesLote = lote.reduce((suma, a) => suma + a.size, 0);
                setLoteActual({ actual: i + 1, total: lotes.length });
                marcar(claves, 'subiendo');

                try {
                    const { data } = await vuelosApi.subirArchivos(vueloId, lote, (cargados, total) => {
                        const proporcion = total > 0 ? cargados / total : 0;
                        setProgreso(Math.min(99, Math.round(((bytesEnviados + bytesLote * proporcion) / bytesTotales) * 100)));
                    });
                    const motivos = new Map(data.rechazados.map((r) => [r.archivo, r.motivo]));
                    marcar(claves, 'aceptado', motivos);
                    acumulado = acumulado
                        ? {
                              recibidos: acumulado.recibidos + data.recibidos,
                              aceptados: acumulado.aceptados + data.aceptados,
                              rechazados: [...acumulado.rechazados, ...data.rechazados],
                              capturasActualizadas: acumulado.capturasActualizadas + data.capturasActualizadas,
                              capturasCompletas: data.capturasCompletas,
                              totalCapturasVuelo: data.totalCapturasVuelo,
                          }
                        : data;
                } catch (e) {
                    marcar(claves, 'pendiente');
                    throw e;
                }
                bytesEnviados += bytesLote;
            }
            setProgreso(100);
            if (acumulado) {
                setResumen(acumulado);
                alTerminar(acumulado);
            }
        } catch (e) {
            setError(mensajeError(e, 'No se pudieron subir las imágenes. Revisa tu conexión e inténtalo de nuevo.'));
            if (acumulado) alTerminar(acumulado);
        } finally {
            setSubiendo(false);
        }
    };

    const pendientes = cola.filter((a) => a.estado === 'pendiente');
    const rechazados = cola.filter((a) => a.estado === 'rechazado');
    const bytesPendientes = pendientes.reduce((suma, a) => suma + a.archivo.size, 0);

    if (bloqueado) {
        return (
            <div className="rounded-xl border-2 border-dashed border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                <Loader2 size={24} className="mx-auto mb-2 animate-spin text-amber-500" />
                {motivoBloqueo ?? 'No es posible subir imágenes en este momento.'}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrando(true);
                }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setArrastrando(false);
                    agregar(e.dataTransfer.files);
                }}
                onClick={() => !subiendo && entrada.current?.click()}
                className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${arrastrando ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
            >
                <UploadCloud size={32} className="mx-auto mb-2 text-primary" />
                <p className="font-semibold text-foreground text-sm">Arrastra aquí las imágenes del dron</p>
                <p className="text-xs text-muted-foreground mt-1">JPG o TIF · máximo 60 MB por archivo · se suben por partes automáticamente</p>
                <p className="text-xs text-muted-foreground">Para el análisis multiespectral sube las 5 bandas de cada captura (_D, _MS_G, _MS_R, _MS_RE, _MS_NIR)</p>
                <Btn size="sm" variant="outline" className="mt-3" disabled={subiendo}>Elegir archivos</Btn>
                <input
                    ref={entrada}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.tif,.tiff"
                    className="hidden"
                    onChange={(e) => {
                        agregar(e.target.files);
                        e.target.value = '';
                    }}
                />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            {resumen && !subiendo && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex gap-2">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">{resumen.aceptados} de {resumen.recibidos} archivos cargados</p>
                        <p className="text-xs">
                            El vuelo tiene {resumen.totalCapturasVuelo} capturas, {resumen.capturasCompletas} con todas las bandas.
                            {resumen.rechazados.length > 0 && ` ${resumen.rechazados.length} archivos fueron rechazados.`}
                        </p>
                    </div>
                </div>
            )}

            {subiendo && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Subiendo parte {loteActual.actual} de {loteActual.total}…</span>
                        <span>{progreso}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progreso}%` }} />
                    </div>
                </div>
            )}

            {cola.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 text-xs">
                        <span className="text-muted-foreground">
                            {pendientes.length} por subir ({tamanoLegible(bytesPendientes)}){rechazados.length > 0 && ` · ${rechazados.length} rechazados`}
                        </span>
                        {!subiendo && (
                            <button className="text-muted-foreground hover:text-foreground" onClick={() => setCola([])}>Limpiar lista</button>
                        )}
                    </div>
                    <ul className="max-h-64 overflow-y-auto divide-y divide-border">
                        {cola.map((item) => {
                            const banda = bandaDelArchivo(item.archivo.name);
                            return (
                                <li key={item.clave} className="flex items-center gap-2 px-3 py-2 text-sm">
                                    <FileImage size={16} className="text-muted-foreground shrink-0" />
                                    <span className="flex-1 min-w-0">
                                        <span className="block truncate text-foreground">{item.archivo.name}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            {tamanoLegible(item.archivo.size)}{banda && ` · Banda ${banda}`}
                                            {item.motivo && <span className="text-red-600"> · Rechazado: {item.motivo}</span>}
                                        </span>
                                    </span>
                                    {item.estado === 'subiendo' && <Loader2 size={16} className="animate-spin text-primary" />}
                                    {item.estado === 'aceptado' && <CheckCircle2 size={16} className="text-emerald-600" />}
                                    {item.estado === 'rechazado' && <XCircle size={16} className="text-red-600" />}
                                    {(item.estado === 'pendiente' || item.estado === 'rechazado') && !subiendo && (
                                        <button onClick={() => quitar(item.clave)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Quitar">
                                            <X size={14} />
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {pendientes.length > 0 && (
                <Btn onClick={subir} disabled={subiendo} className="w-full justify-center">
                    {subiendo ? <><Loader2 size={16} className="animate-spin" />Subiendo…</> : <><UploadCloud size={16} />Subir {pendientes.length} archivos</>}
                </Btn>
            )}
        </div>
    );
};

export default CargaImagenes;
