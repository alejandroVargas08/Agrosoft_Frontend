import { useProductoAgroForm } from "../../hooks/productosAgro/useProductoAgroForm";
import type { ProductoAgro } from "../../types/productosAgro";
import { Btn, Input, Modal, Textarea } from "../ui/AgroUI";

interface Props {
    producto: ProductoAgro | null; 
    onClose: () => void; 
}

export function ProductoAgroModal({ producto, onClose }: Props) {
    const { 
        form,
        set, 
        handleSubmit,
        guardando,
        errorForm,
        esEdicion
    } = useProductoAgroForm({
        productoEnEdicion: producto,
        onSuccess: onClose,
    }); 

    return (
    <Modal open onClose={onClose} title={esEdicion ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
            {errorForm && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
            )}
            <Input label="Nombre" required value={form.nombre} onChange={set('nombre')} placeholder="Ej: Maíz amarillo" />
            <Input label="Unidad base" required value={form.unidadBase} onChange={set('unidadBase')} placeholder="Ej: kg, bulto, litro" />
            <Textarea label="Descripción" value={form.descripcion ?? ''} onChange={set('descripcion')} placeholder="Opcional" />
            <Input label="Imagen (URL)" value={form.imagen} onChange={set('imagen')} placeholder="https://… (opcional)" />
            <div className="flex gap-3 pt-2">
                <Btn type="submit" disabled={guardando} className="flex-1 justify-center">
                {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
                </Btn>
                <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
            </div>
        </form>
    </Modal>
    ); 
}