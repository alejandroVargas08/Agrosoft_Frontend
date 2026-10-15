import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Sprout } from 'lucide-react';
import { Badge, Btn, Card, EmptyState, SearchBar, StatusBadge } from '../ui/AgroUI';
import { useLotesProduccion } from '../../hooks/useLotesProduccion';
import { LoteProduccionModal } from './LoteProduccionModal';
import { DescontarStockModal } from './DescontarStockModal';
import type { loteProduccion } from '../../types/lotesProduccion';
import { lotesApi, productosAgroApi } from '../../api/actividades/actividades';
import type { Lote } from '../../types/territorio';
import type { ProductoAgro } from '../../types/productosAgro';

const cop = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const kg = (n: number) => `${n.toLocaleString('es-CO')} kg`;

export function LotesProduccionPanel() {
const { lotes, loading, error, descontarStock, descontando, errorDescontar, limpiarErrorDescontar } =
    useLotesProduccion();


const { data: productos = [] } = useQuery({
    queryKey: ['productos-agro'],
    queryFn: async () => (await productosAgroApi.listar()).data,
});

const { data: lotesTerreno = [] } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => (await lotesApi.listar()).data,
});

const nombreProducto = (id: number) => productos.find((p: ProductoAgro) => p.id === id)?.nombre ?? `Producto #${id}`;
const nombreLote = (id: number) => lotesTerreno.find((l: Lote) => l.id === id)?.nombre ?? `Lote #${id}`;

const [busqueda, setBusqueda] = useState('');
const [modalAbierto, setModalAbierto] = useState(false);
const [loteEnEdicion, setLoteEnEdicion] = useState<loteProduccion | null>(null);
const [loteADescontar, setLoteADescontar] = useState<loteProduccion | null>(null);

const abrirParaCrear = () => {
    setLoteEnEdicion(null);
    setModalAbierto(true);
};

const abrirParaEditar = (l: loteProduccion) => {
    setLoteEnEdicion(l);
    setModalAbierto(true);
};

const abrirDescontar = (l: loteProduccion) => {
    limpiarErrorDescontar();
    setLoteADescontar(l);
};

const filtrados = lotes.filter((l) => {
    const texto = `${nombreProducto(l.productoAgroId)} ${l.calidad} ${nombreLote(l.loteId)}`.toLowerCase();
    return texto.includes(busqueda.trim().toLowerCase());
});

return (
    <div>
        <div className="flex gap-3 items-center">
        <div className="flex-1">
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por producto, calidad o lote..." />
        </div>
        <Btn onClick={abrirParaCrear}><Plus size={16} />Nuevo Lote</Btn>
        </div>

        {loading && <p className="text-sm text-muted-foreground mt-3">Cargando lotes de producción...</p>}
        {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
        )}

        <div className="space-y-3 mt-3">
        {filtrados.map((l) => {
            const agotado = l.stockDisponibleKg <= 0;
            return (
            <Card key={l.id} className={agotado ? 'border-red-200 bg-red-50/30' : ''}>
                <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><Sprout size={18} /></div>
                    <div>
                    <p className="font-semibold text-foreground">{nombreProducto(l.productoAgroId)}</p>
                    <p className="text-xs text-muted-foreground">
                        {nombreLote(l.loteId)} · Cultivo #{l.cultivoId}
                    </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {agotado && <Badge color="danger">Agotado</Badge>}
                    <StatusBadge status={l.calidad} />
                </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                <div className="p-2 bg-muted rounded-lg text-center">
                    <p className="text-muted-foreground">Producido</p>
                    <p className="font-bold text-foreground">{kg(l.cantidadKg)}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg text-center">
                    <p className="text-muted-foreground">Disponible</p>
                    <p className="font-bold text-foreground">{kg(l.stockDisponibleKg)}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg text-center">
                    <p className="text-muted-foreground">Precio sugerido</p>
                        <p className="font-bold text-foreground">{cop(l.precioSugeridoKg)}/kg</p>
                </div>
            </div>

                <p className="text-xs text-muted-foreground mt-2">
                Costo: {cop(l.costoUnitarioKg)}/kg · Total {cop(l.costoTotal)}
                </p>

                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Btn size="sm" variant="outline" onClick={() => abrirParaEditar(l)}>Editar</Btn>
                <Btn size="sm" variant="outline" disabled={agotado} onClick={() => abrirDescontar(l)}>
                    Descontar stock
                </Btn>
                </div>
            </Card>
            );
        })}
        </div>

        {!loading && filtrados.length === 0 && (
        <EmptyState
            icon={Sprout}
            title="Sin lotes de producción"
            description={busqueda ? 'Ningún lote coincide con la búsqueda' : 'Registra la primera cosecha como lote de producción'}
            action={<Btn onClick={abrirParaCrear}><Plus size={16} />Nuevo Lote</Btn>}
        />
        )}

        {modalAbierto && (
        <LoteProduccionModal
            key={loteEnEdicion?.id ?? 'nuevo'}
            lote={loteEnEdicion}
            onClose={() => setModalAbierto(false)}
        />
        )}

        {loteADescontar && (
        <DescontarStockModal
            key={loteADescontar.id}
            lote={loteADescontar}
            descontando={descontando}
            errorBackend={errorDescontar}
            onConfirmar={(cantidad) => descontarStock(loteADescontar.id, cantidad, () => setLoteADescontar(null))}
            onClose={() => setLoteADescontar(null)}
        />
        )}
    </div>
    );
}