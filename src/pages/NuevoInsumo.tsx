import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, PageHeader } from '../components/ui/AgroUI';
import FormularioInsumo from '../components/inventario/FormularioInsumo';

const NuevoInsumo = () => {
    const navigate = useNavigate();
    const volver = () => navigate('/inventario');

    return (
        <DashboardLayout>
            <div className="max-w-lg mx-auto p-4 sm:p-6">
                <PageHeader title="Nuevo Insumo" onBack={volver} />
                <Card>
                    <FormularioInsumo onGuardado={volver} onCancelar={volver} />
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default NuevoInsumo;
