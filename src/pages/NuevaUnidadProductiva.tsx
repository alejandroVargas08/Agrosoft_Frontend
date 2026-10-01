import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, Input, PageHeader, Select } from '../components/ui/AgroUI';
import { useNuevaUnidadForm } from '../hooks/useNuevaUnidadForm';

const TIPOS_CULTIVO = [
    'Horticultura', 'Cereales', 'Fruticultura', 'Hidroponía', 'Aromáticas', 'Leguminosas',
];

const NuevaUnidadProductiva = () => {
    const navigate = useNavigate();
    const volver = () => navigate('/unidades-productivas');

    const { form, set, lotes, enviando, errorForm, handleSubmit } =
        useNuevaUnidadForm({ onSuccess: volver });

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <PageHeader title="Nueva Unidad Productiva" onBack={volver} />
                <Card className="max-w-lg">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {errorForm && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errorForm}</div>
                        )}

                        <Input label="Nombre" value={form.name} onChange={set('name')} required placeholder="Ej: Tomate Chonto" />

                        <Select
                            label="Tipo de cultivo" value={form.type} onChange={set('type')}
                            options={TIPOS_CULTIVO}
                        />

                        <Input label="Área (m²)" value={form.area} onChange={set('area')} type="number" placeholder="2000" />

                        <Select
                            label="Lote asociado" value={form.plotId} onChange={set('plotId')}
                            options={[{ value: '', label: 'Sin lote' }, ...lotes.map((l) => ({ value: String(l.id), label: l.nombre }))]}
                        />

                        <Input label="Fecha de inicio" value={form.startDate} onChange={set('startDate')} type="date" />

                        <div className="flex gap-3 pt-2">
                            <Btn type="submit" disabled={enviando} className="flex-1 justify-center">
                                {enviando ? 'Guardando...' : 'Guardar Unidad'}
                            </Btn>
                            <Btn variant="outline" onClick={volver}>Cancelar</Btn>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default NuevaUnidadProductiva;