import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, Input, Modal, PageHeader, Select } from '../components/ui/AgroUI';
import { useNuevoInsumoForm } from '../hooks/useNuevoInsumoForm';
import type { TipoInsumo } from '../types/inventario';

const NuevoInsumo = () => {
    const navigate = useNavigate();
    const volver = () => navigate('/inventario');
    const [modalCategoria, setModalCategoria] = useState(false);
    const [modalProveedor, setModalProveedor] = useState(false);

    const {
        form, set, almacenes, categorias, proveedores,
        nuevaCategoria, setNuevaCategoria, crearCategoria,
        nuevoProveedor, setNuevoProveedor, crearProveedor,
        enviando, errorForm, handleSubmit,
    } = useNuevoInsumoForm({ onSuccess: volver });

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <PageHeader title="Nuevo Insumo" onBack={volver} />
                <Card className="max-w-lg">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {errorForm && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
                        )}

                        <Input label="Nombre del insumo" value={form.nombre} onChange={set('nombre')} required
                            placeholder="Ej: Fertilizante NPK 15-15-15" />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Select
                                    label="Categoría" value={form.categoriaId} onChange={set('categoriaId')}
                                    options={[{ value: '', label: 'Seleccione...' }, ...categorias.map((c) => ({ value: String(c.id), label: c.nombre }))]}
                                />
                                <button type="button" onClick={() => setModalCategoria(true)}
                                    className="mt-1 text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                                    <Plus size={12} />Nueva categoría
                                </button>
                            </div>
                            <Select
                                label="Tipo" value={form.tipoInsumo}
                                onChange={(v) => set('tipoInsumo')(v as TipoInsumo)}
                                options={[
                                    { value: 'consumible', label: 'Insumo' },
                                    { value: 'herramienta', label: 'Herramienta' },
                                    { value: 'materia_prima', label: 'Materia prima' },
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <Input label="Unidad compra" value={form.presentacionTipo} onChange={set('presentacionTipo')} required placeholder="Bulto 50kg" />
                            <Input label="Unidad uso" value={form.unidadUso} onChange={set('unidadUso')} required placeholder="kg" />
                            <Input label="Factor conversión" value={form.factorConversionUso} onChange={set('factorConversionUso')} type="number" step="any" required />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Stock mínimo" value={form.stockMinimo} onChange={set('stockMinimo')} type="number" step="any" required />
                            <Input label="Precio unitario (COP)" value={form.precioUnitarioPresentacion} onChange={set('precioUnitarioPresentacion')} type="number" step="any" required />
                        </div>

                        <Select
                            label="Almacén" value={form.almacenId} onChange={set('almacenId')}
                            options={[{ value: '', label: 'Seleccione...' }, ...almacenes.map((a) => ({ value: String(a.id), label: a.nombre }))]}
                        />

                        <div>
                            <Select
                                label="Proveedor" value={form.proveedorId} onChange={set('proveedorId')}
                                options={[{ value: '', label: 'Sin proveedor' }, ...proveedores.map((p) => ({ value: String(p.id), label: p.nombre }))]}
                            />
                            <button type="button" onClick={() => setModalProveedor(true)}
                                className="mt-1 text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                                <Plus size={12} />Nuevo proveedor
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Btn type="submit" disabled={enviando} className="flex-1 justify-center">
                                {enviando ? 'Guardando...' : 'Guardar Insumo'}
                            </Btn>
                            <Btn variant="outline" onClick={volver}>Cancelar</Btn>
                        </div>
                    </form>
                </Card>
            </div>

            {/* Modal: nueva categoría */}
            <Modal open={modalCategoria} onClose={() => setModalCategoria(false)} title="Nueva categoría">
                <div className="space-y-4">
                    <Input label="Nombre" value={nuevaCategoria} onChange={setNuevaCategoria} placeholder="Ej: Fertilizantes" />
                    <p className="text-xs text-muted-foreground">
                        Se crea para el tipo seleccionado en el formulario: {form.tipoInsumo.replace('_', ' ')}.
                    </p>
                    {crearCategoria.isError && <p className="text-sm text-red-600">No se pudo crear la categoría</p>}
                    <div className="flex gap-3">
                        <Btn className="flex-1 justify-center" disabled={crearCategoria.isPending || !nuevaCategoria}
                            onClick={() => crearCategoria.mutate(undefined, { onSuccess: () => setModalCategoria(false) })}>
                            {crearCategoria.isPending ? 'Guardando...' : 'Crear categoría'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setModalCategoria(false)}>Cancelar</Btn>
                    </div>
                </div>
            </Modal>

            {/* Modal: nuevo proveedor */}
            <Modal open={modalProveedor} onClose={() => setModalProveedor(false)} title="Nuevo proveedor">
                <div className="space-y-4">
                    <Input label="Nombre" value={nuevoProveedor} onChange={setNuevoProveedor} placeholder="Ej: AgroInsumos Ltda." />
                    {crearProveedor.isError && <p className="text-sm text-red-600">No se pudo crear el proveedor</p>}
                    <div className="flex gap-3">
                        <Btn className="flex-1 justify-center" disabled={crearProveedor.isPending || !nuevoProveedor}
                            onClick={() => crearProveedor.mutate(undefined, { onSuccess: () => setModalProveedor(false) })}>
                            {crearProveedor.isPending ? 'Guardando...' : 'Crear proveedor'}
                        </Btn>
                        <Btn variant="outline" onClick={() => setModalProveedor(false)}>Cancelar</Btn>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default NuevoInsumo;