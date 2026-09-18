import DashboardLayout from '../componets/layout/DashboardLayout';
import { useCatalogosInventario } from '../hooks/useCatalogosInventario';

const inputCls = 'w-full rounded-xl border border-neutral-200 py-2 px-3 text-sm';
const btnCls = 'w-full bg-green-800 text-white py-2 rounded-xl text-sm disabled:opacity-50';

const CatalogosInventario = () => {
    const {
        almacenes, categorias, proveedores, cargando,
        formAlmacen, setFormAlmacen, crearAlmacen,
        formCategoria, setFormCategoria, crearCategoria,
        formProveedor, setFormProveedor, crearProveedor,
    } = useCatalogosInventario();

    return (
        <DashboardLayout>
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">Catálogos de inventario</h1>
            <p className="text-neutral-500">Almacenes, categorías y proveedores</p>
            </div>

            {cargando && <p className="text-neutral-500 mb-4">Cargando...</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Almacenes */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold mb-3">Almacenes</h2>
                <form onSubmit={(e) => { e.preventDefault(); crearAlmacen.mutate(); }} className="space-y-2 mb-4">
                <input required placeholder="Nombre" value={formAlmacen.nombre}
                    onChange={(e) => setFormAlmacen({ ...formAlmacen, nombre: e.target.value })} className={inputCls} />
                <input placeholder="Ubicación (opcional)" value={formAlmacen.ubicacion}
                    onChange={(e) => setFormAlmacen({ ...formAlmacen, ubicacion: e.target.value })} className={inputCls} />
                <button type="submit" disabled={crearAlmacen.isPending} className={btnCls}>
                    {crearAlmacen.isPending ? 'Guardando...' : '+ Agregar almacén'}
                </button>
                {crearAlmacen.isError && <p className="text-red-600 text-xs">No se pudo guardar</p>}
                </form>
                <ul className="space-y-1 text-sm">
                {almacenes.map((a) => (
                    <li key={a.id} className="border-b py-1">
                    {a.nombre}
                    {a.ubicacion && <span className="text-neutral-400"> · {a.ubicacion}</span>}
                    </li>
                ))}
                {almacenes.length === 0 && <li className="text-neutral-400">Sin almacenes</li>}
                </ul>
            </section>

            {/* Categorías */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold mb-3">Categorías</h2>
                <form onSubmit={(e) => { e.preventDefault(); crearCategoria.mutate(); }} className="space-y-2 mb-4">
                <input required placeholder="Nombre" value={formCategoria.nombre}
                    onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })} className={inputCls} />
                <select value={formCategoria.tipoInsumo}
                    onChange={(e) => setFormCategoria({ ...formCategoria, tipoInsumo: e.target.value })} className={inputCls}>
                    <option value="consumible">Consumible</option>
                    <option value="herramienta">Herramienta</option>
                </select>
                <button type="submit" disabled={crearCategoria.isPending} className={btnCls}>
                    {crearCategoria.isPending ? 'Guardando...' : '+ Agregar categoría'}
                </button>
                {crearCategoria.isError && <p className="text-red-600 text-xs">No se pudo guardar</p>}
                </form>
                <ul className="space-y-1 text-sm">
                {categorias.map((c) => (
                    <li key={c.id} className="border-b py-1">
                    {c.nombre} <span className="text-neutral-400">· {c.tipoInsumo}</span>
                    </li>
                ))}
                {categorias.length === 0 && <li className="text-neutral-400">Sin categorías</li>}
                </ul>
            </section>

            {/* Proveedores */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold mb-3">Proveedores</h2>
                <form onSubmit={(e) => { e.preventDefault(); crearProveedor.mutate(); }} className="space-y-2 mb-4">
                <input required placeholder="Nombre" value={formProveedor.nombre}
                    onChange={(e) => setFormProveedor({ nombre: e.target.value })} className={inputCls} />
                <button type="submit" disabled={crearProveedor.isPending} className={btnCls}>
                    {crearProveedor.isPending ? 'Guardando...' : '+ Agregar proveedor'}
                </button>
                {crearProveedor.isError && <p className="text-red-600 text-xs">No se pudo guardar</p>}
                </form>
                <ul className="space-y-1 text-sm">
                {proveedores.map((p) => (
                    <li key={p.id} className="border-b py-1">{p.nombre}</li>
                ))}
                {proveedores.length === 0 && <li className="text-neutral-400">Sin proveedores</li>}
                </ul>
            </section>
            </div>
        </div>
        </DashboardLayout>
    );
};

export default CatalogosInventario;