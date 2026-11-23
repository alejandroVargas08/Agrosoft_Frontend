import { useState } from 'react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { sensoresApi } from '../../api/sensores';
import { mensajeError } from '../../api/errores/errores';
import { Btn, Input, Select } from '../ui/AgroUI';
import type { Sensor, TipoSensor } from '../../types/sensor';

// La alerta salta cuando el valor supera el máximo. "Alerta desde 6" es un
// máximo de 5,5: con índices enteros, 6 ya lo supera y 5 no.
const uvAMaximo = (desde: number) => desde - 0.5;
const maximoAUv = (max: number) => Math.ceil(max + 0.01);

const OPCIONES_UV = ['3', '4', '5', '6', '7', '8', '9', '10', '11'];

const CAMPOS: { tipo: TipoSensor; min: string; max: string }[] = [
    { tipo: 'temperatura', min: 'Temp. mínima (°C)', max: 'Temp. máxima (°C)' },
    { tipo: 'humedad', min: 'Humedad mín (%)', max: 'Humedad máx (%)' },
    { tipo: 'luminosidad', min: 'Lux mínimo', max: 'Lux máximo' },
];

interface Props {
    medida: (tipo: TipoSensor) => Sensor | undefined;
    onCancelar: () => void;
    onGuardado: () => void;
}

/** "Editar rangos de la estación": todas las medidas en un solo formulario. */
export default function EditarRangosEstacion({ medida, onCancelar, onGuardado }: Props) {
    const inicial: Record<string, string> = {};
    for (const c of CAMPOS) {
        const s = medida(c.tipo);
        if (!s) continue;
        inicial[c.tipo + 'Min'] = s.min !== null ? String(s.min) : '';
        inicial[c.tipo + 'Max'] = s.max !== null ? String(s.max) : '';
    }
    const uv = medida('uv');
    inicial.uvDesde = uv?.max !== null && uv?.max !== undefined ? String(maximoAUv(uv.max)) : '8';

    const [form, setForm] = useState(inicial);
    const [error, setError] = useState<string | null>(null);
    const poner = (clave: string) => (valor: string) => setForm((f) => ({ ...f, [clave]: valor }));

    const mutacion = useMutation({
        mutationFn: async (cambios: { id: number; valorMinimoSensor: number; valorMaximoSensor: number }[]) => {
            for (const c of cambios) {
                await sensoresApi.actualizarRango(c.id, { valorMinimoSensor: c.valorMinimoSensor, valorMaximoSensor: c.valorMaximoSensor });
            }
        },
        onSuccess: () => { toast.success('Rangos actualizados'); onGuardado(); },
    });

    const guardar = () => {
        const cambios: { id: number; valorMinimoSensor: number; valorMaximoSensor: number }[] = [];
        for (const c of CAMPOS) {
            const s = medida(c.tipo);
            if (!s) continue;
            const min = Number(form[c.tipo + 'Min']);
            const max = Number(form[c.tipo + 'Max']);
            if (form[c.tipo + 'Min'] === '' || form[c.tipo + 'Max'] === '' || !Number.isFinite(min) || !Number.isFinite(max)) {
                setError(`Completa el mínimo y el máximo de ${c.min.split(' ')[0].toLowerCase()}.`);
                return;
            }
            // El dominio rechaza mínimo >= máximo: se avisa antes de enviar
            if (min >= max) {
                setError(`En ${c.max.split(' ')[0].toLowerCase()} el mínimo debe ser menor que el máximo.`);
                return;
            }
            if (min !== s.min || max !== s.max) cambios.push({ id: Number(s.id), valorMinimoSensor: min, valorMaximoSensor: max });
        }
        if (uv) {
            const max = uvAMaximo(Number(form.uvDesde));
            const min = uv.min !== null && uv.min < max ? uv.min : 0;
            if (max !== uv.max || min !== uv.min) cambios.push({ id: Number(uv.id), valorMinimoSensor: min, valorMaximoSensor: max });
        }
        setError(null);
        if (cambios.length === 0) { onCancelar(); return; }
        mutacion.mutate(cambios);
    };

    const opcionesUv = OPCIONES_UV.includes(form.uvDesde) ? OPCIONES_UV : [...OPCIONES_UV, form.uvDesde];

    return (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
            {CAMPOS.filter((c) => medida(c.tipo)).map((c) => (
                <div key={c.tipo} className="grid grid-cols-2 gap-3">
                    <Input label={c.min} value={form[c.tipo + 'Min']} onChange={poner(c.tipo + 'Min')} type="number" />
                    <Input label={c.max} value={form[c.tipo + 'Max']} onChange={poner(c.tipo + 'Max')} type="number" />
                </div>
            ))}
            {uv && (
                <Select label="Alerta UV desde índice" value={form.uvDesde} onChange={poner('uvDesde')} options={opcionesUv} />
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {mutacion.error && <p className="text-sm text-red-600">{mensajeError(mutacion.error, 'No se pudieron guardar los rangos.')}</p>}

            <div className="flex gap-3 pt-2">
                <Btn type="submit" disabled={mutacion.isPending} className="flex-1 justify-center">
                    {mutacion.isPending ? 'Guardando…' : 'Guardar rangos'}
                </Btn>
                <Btn variant="outline" onClick={onCancelar}>Cancelar</Btn>
            </div>
        </form>
    );
}
