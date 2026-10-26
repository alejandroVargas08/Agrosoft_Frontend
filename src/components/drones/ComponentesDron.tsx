import { ImageOff, Loader2 } from 'lucide-react';
import { vuelosApi } from '../../api/drones/drones';
import { useImagenProtegida } from '../../hooks/drones/useImagenProtegida';
import type { Banda, CapaMapa, ClaseVegetacion, EstadoVuelo } from '../../types/drones/drones';
import { CLASE_VEGETACION, ESTADO_VUELO } from '../../types/drones/drones';

export const EstadoVueloBadge = ({ estado }: { estado: EstadoVuelo }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_VUELO[estado].clases}`}>
        {estado === 'ANALIZANDO' && <Loader2 size={12} className="animate-spin" />}
        {ESTADO_VUELO[estado].texto}
    </span>
);

export const BarraDistribucion = ({ distribucion, alta = false }: { distribucion: Record<ClaseVegetacion, number>; alta?: boolean }) => {
    const orden: ClaseVegetacion[] = ['SALUDABLE', 'ESTRES_MODERADO', 'ESTRES_ALTO', 'SIN_VEGETACION'];
    return (
        <div className={`flex w-full overflow-hidden rounded-full bg-muted ${alta ? 'h-3' : 'h-1.5'}`}>
            {orden.map((clase) =>
                distribucion[clase] > 0 ? (
                    <div
                        key={clase}
                        title={`${CLASE_VEGETACION[clase].texto}: ${distribucion[clase].toFixed(1)} %`}
                        style={{ width: `${distribucion[clase]}%`, backgroundColor: CLASE_VEGETACION[clase].color }}
                    />
                ) : null,
            )}
        </div>
    );
};

interface ImagenCapturaProps {
    vueloId: number;
    capturaId: number;
    capa?: CapaMapa;
    banda?: Banda;
    tamano?: 'miniatura' | 'completa';
    className?: string;
    alt?: string;
}

export const ImagenCaptura = ({ vueloId, capturaId, capa = 'RGB', banda = 'RGB', tamano = 'miniatura', className = '', alt = '' }: ImagenCapturaProps) => {
    const clave = `${vueloId}-${capturaId}-${capa}-${banda}-${tamano}`;
    const { url, cargando, error } = useImagenProtegida(
        () => (capa === 'RGB' ? vuelosApi.imagen(vueloId, capturaId, banda, tamano) : vuelosApi.capa(vueloId, capturaId, capa)),
        clave,
    );

    if (cargando || (!url && !error)) {
        return (
            <div className={`flex items-center justify-center bg-muted animate-pulse ${className}`}>
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (error || !url) {
        return (
            <div className={`flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground text-xs ${className}`}>
                <ImageOff size={18} />
                Sin imagen
            </div>
        );
    }
    return <img src={url} alt={alt} className={`object-cover ${className}`} />;
};
