import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ImageOff, X } from 'lucide-react';

/**
 * La galería de evidencias que el instructor ve al abrir una entrega en
 * Por revisar, portada del EvidenceGallery del diseño: una foto grande,
 * las miniaturas debajo y un visor a pantalla completa.
 */

export interface FotoEvidencia {
    id: string;
    url: string;
    nombre: string;
}

export interface DatosDeLaEntrega {
    aprendiz: string;
    actividad: string;
    fecha: string;
}

function Visor({
    fotos, indiceInicial, datos, alCerrar,
}: {
    fotos: FotoEvidencia[];
    indiceInicial: number;
    datos: DatosDeLaEntrega;
    alCerrar: () => void;
}) {
    const [indice, setIndice] = useState(indiceInicial);
    const actual = fotos[indice];

    useEffect(() => {
        const tecla = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') alCerrar();
            if (fotos.length < 2) return;
            if (evento.key === 'ArrowLeft') setIndice((v) => (v - 1 + fotos.length) % fotos.length);
            if (evento.key === 'ArrowRight') setIndice((v) => (v + 1) % fotos.length);
        };
        window.addEventListener('keydown', tecla);
        return () => window.removeEventListener('keydown', tecla);
    }, [alCerrar, fotos.length]);

    if (!actual) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col bg-black/[0.85] px-4 py-5 text-white backdrop-blur-sm sm:px-8"
            role="dialog"
            aria-modal="true"
            aria-label="Visor de evidencia fotográfica"
        >
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
                <span className="rounded-full bg-black/40 px-3 py-1.5 text-sm font-semibold">
                    {indice + 1} de {fotos.length}
                </span>
                <div className="flex items-center gap-2">
                    <a
                        href={actual.url}
                        download={actual.nombre}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Descargar foto"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <Download size={19} />
                    </a>
                    <button
                        type="button"
                        onClick={alCerrar}
                        aria-label="Cerrar visor"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <X size={21} />
                    </button>
                </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center py-4 sm:py-6">
                {fotos.length > 1 && (
                    <button
                        type="button"
                        onClick={() => setIndice((v) => (v - 1 + fotos.length) % fotos.length)}
                        aria-label="Foto anterior"
                        className="absolute left-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 transition-colors hover:bg-white/20 sm:left-2"
                    >
                        <ChevronLeft size={26} />
                    </button>
                )}
                <img
                    src={actual.url}
                    alt={`Evidencia ${indice + 1} de ${datos.actividad}`}
                    className="max-h-full max-w-[calc(100%-5rem)] rounded-xl object-contain shadow-2xl"
                />
                {fotos.length > 1 && (
                    <button
                        type="button"
                        onClick={() => setIndice((v) => (v + 1) % fotos.length)}
                        aria-label="Foto siguiente"
                        className="absolute right-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 transition-colors hover:bg-white/20 sm:right-2"
                    >
                        <ChevronRight size={26} />
                    </button>
                )}
            </div>

            <div className="mx-auto w-full max-w-3xl border-t border-white/15 pt-4 text-center">
                <p className="text-sm font-semibold text-white">{datos.aprendiz}</p>
                <p className="mt-1 text-xs text-white/70">
                    {datos.actividad} · {datos.fecha}
                </p>
            </div>
        </div>
    );
}

export function GaleriaEvidencias({ fotos, datos }: { fotos: FotoEvidencia[]; datos: DatosDeLaEntrega }) {
    const [elegida, setElegida] = useState(0);
    const [enVisor, setEnVisor] = useState<number | null>(null);

    if (fotos.length === 0) {
        return (
            <section aria-labelledby="evidencias-del-aprendiz">
                <h3 id="evidencias-del-aprendiz" className="mb-3 text-base font-semibold text-foreground">
                    Evidencias del aprendiz
                </h3>
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F8FAF7] px-4 py-10 text-center">
                    <ImageOff size={30} className="mb-2 text-[#6B7280]" />
                    <p className="text-sm font-medium text-[#6B7280]">El aprendiz no adjuntó fotos</p>
                </div>
            </section>
        );
    }

    // Si borran una foto mientras está abierta, no dejar el índice colgando
    const actual = Math.min(elegida, fotos.length - 1);

    return (
        <section aria-labelledby="evidencias-del-aprendiz">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id="evidencias-del-aprendiz" className="text-base font-semibold text-foreground">
                    Evidencias del aprendiz
                </h3>
                <span className="text-xs font-medium text-[#6B7280]">
                    {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
                </span>
            </div>

            <button
                type="button"
                onClick={() => setEnVisor(actual)}
                className="block aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#EBF3ED] focus:outline-none focus:ring-2 focus:ring-[#2D7A3E] focus:ring-offset-2"
            >
                <img
                    src={fotos[actual].url}
                    alt={`Evidencia seleccionada de ${datos.aprendiz}`}
                    className="h-full w-full object-cover"
                />
            </button>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {fotos.map((foto, indice) => (
                    <button
                        key={foto.id}
                        type="button"
                        onClick={() => setElegida(indice)}
                        aria-label={`Seleccionar foto ${indice + 1}`}
                        className={
                            'h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#EBF3ED] transition-all ' +
                            (actual === indice ? 'border-[#2D7A3E]' : 'border-transparent opacity-75 hover:opacity-100')
                        }
                    >
                        <img src={foto.url} alt="" className="h-full w-full object-cover" />
                    </button>
                ))}
            </div>

            {enVisor !== null && (
                <Visor
                    fotos={fotos}
                    indiceInicial={enVisor}
                    datos={datos}
                    alCerrar={() => setEnVisor(null)}
                />
            )}
        </section>
    );
}
