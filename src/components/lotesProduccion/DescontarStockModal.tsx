import { useState } from 'react';
import { Btn, Input, Modal } from '../ui/AgroUI';
import type { loteProduccion } from '../../types/lotesProduccion';

interface Props {
    lote: loteProduccion;
    descontando: boolean;
    errorBackend: string | null;
    onConfirmar: (cantidadKg: number) => void;
    onClose: () => void;
}

export function DescontarStockModal({ lote, descontando, errorBackend, onConfirmar, onClose }: Props) {
const [cantidad, setCantidad] = useState('');
const [errorLocal, setErrorLocal] = useState<string | null>(null);

const confirmar = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = Number(cantidad);
    if (!(kg > 0)) return setErrorLocal('La cantidad debe ser mayor a 0.');
    if (kg > lote.stockDisponibleKg)
        return setErrorLocal(`Solo hay ${lote.stockDisponibleKg.toLocaleString('es-CO')} kg disponibles.`);
    setErrorLocal(null);
    onConfirmar(kg);
};

const error = errorLocal ?? errorBackend;

return (
    <Modal open onClose={onClose} title="Descontar stock">
        <form onSubmit={confirmar} className="space-y-4">
        <p className="text-sm text-muted-foreground">
        Stock disponible: <strong className="text-foreground">{lote.stockDisponibleKg.toLocaleString('es-CO')} kg</strong>
        </p>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <Input label="Cantidad a descontar (kg)" type="number" step="any" required value={cantidad} onChange={setCantidad} />
        <div className="flex gap-3">
            <Btn type="submit" disabled={descontando} className="flex-1 justify-center">
            {descontando ? 'Descontando...' : 'Descontar'}
            </Btn>
            <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
        </form>
    </Modal>
    );
}