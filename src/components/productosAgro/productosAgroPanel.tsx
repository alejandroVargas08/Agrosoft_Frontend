import { useState } from "react";
import { useProductoAgro } from "../../hooks/productosAgro/useProductoAgro";
import type { ProductoAgro } from "../../types/productosAgro";
import { Btn, Card, EmptyState, SearchBar } from "../ui/AgroUI";
import { Badge, Package, Plus } from "lucide-react";
import { ProductoAgroModal } from "./productoAgroModal";

export function ProductosAgroPanel() {
    const { 
        productos,
        loading,
        error,
        handleEliminar,
        eliminando,
        errorEliminar, 
    } = useProductoAgro();

    const [busqueda, setBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [productoEnEdicion, setProductoEnEdicion] = useState<ProductoAgro | null>(null); 

    const abrirParaCrear = () => {
        setProductoEnEdicion(null);
        setModalAbierto(true);
    };
    const abrirParaEditar = (p: ProductoAgro) => {
        setProductoEnEdicion(p);
        setModalAbierto(true);
    }; 

    const filtrados = productos.filter((p: ProductoAgro) => 
        p.nombre.toLowerCase().includes(busqueda.trim().toLocaleLowerCase()), 
    );

    return (
    <div>
        <div className="flex gap-3 items-center">
            <div className="flex-1">
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar productos..." />
        </div>
        <Btn onClick={abrirParaCrear}><Plus size={16} />Nuevo Producto</Btn>
        </div>

        {loading && <p className="text-sm text-muted-foreground mt-3">Cargando productos...</p>}
        {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
        )}
        {errorEliminar && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{errorEliminar}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {filtrados.map((p: ProductoAgro) => (
            <Card key={p.id}>
            <div className="flex items-start gap-3">
                {p.imagen ? (
                <img src={p.imagen} alt={p.nombre} className="w-14 h-14 rounded-lg object-cover bg-muted shrink-0" />
                ) : (
                <div className="w-14 h-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Package size={22} />
                </div>
                )}
                <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground truncate">{p.nombre}</p>
                    <Badge color="info">{p.unidadBase}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {p.descripcion || 'Sin descripción registrada.'}
                </p>
                </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                <Btn size="sm" variant="outline" onClick={() => abrirParaEditar(p)}>Editar</Btn>
                <Btn
                size="sm"
                variant="danger"
                disabled={eliminando}
                onClick={() => {
                    if (window.confirm(`¿Eliminar "${p.nombre}"?`)) handleEliminar(p.id);
                }}
                >
                Eliminar
                </Btn>
            </div>
            </Card>
        ))}
        </div>

        {!loading && filtrados.length === 0 && (
        <EmptyState
            icon={Package}
            title="Sin productos"
            description={busqueda ? 'Ningún producto coincide con la búsqueda' : 'Registra el primer producto agropecuario'}
            action={<Btn onClick={abrirParaCrear}><Plus size={16} />Nuevo Producto</Btn>}
            />
        )}

        {modalAbierto && (
            <ProductoAgroModal
            key={productoEnEdicion?.id ?? 'nuevo'}
            producto={productoEnEdicion}
            onClose={() => setModalAbierto(false)}
        />
        )}
    </div>
    );
}