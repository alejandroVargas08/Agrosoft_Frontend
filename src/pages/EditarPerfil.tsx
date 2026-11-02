import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { usePerfil } from '../hooks/usePerfil';
import { InicioUsuario } from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Btn, Card, Input, PageHeader } from '../components/ui/AgroUI';
import { mensajeError } from '../api/errores/errores';

function inicial(nombre?: string) {
    return nombre?.trim()?.charAt(0)?.toUpperCase() || 'U';
}

// Separa un nombre completo cuando el apellido viene vacío
function separarNombreCompleto(nombreCompleto: string, apellidoExistente?: string) {
    if (apellidoExistente && apellidoExistente.trim().length > 0) {
        return { nombre: nombreCompleto.trim(), apellido: apellidoExistente.trim() };
    }

    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length <= 1) return { nombre: partes[0] || '', apellido: '' };
    if (partes.length === 2) return { nombre: partes[0], apellido: partes[1] };
    // Con 3 o más palabras: "Manuel Vargas Noriega" → "Manuel" + "Vargas Noriega"
    return {
        nombre: partes.slice(0, -2).join(' ') || partes[0],
        apellido: partes.slice(-2).join(' '),
    };
}

export default function EditarPerfil() {
    const navigate = useNavigate();
    const { user } = InicioUsuario();
    const { perfil, cargando, actualizarPerfil } = usePerfil();

    const sesionNombre = user?.nombre || user?.nombres || user?.name || '';

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const volver = () => navigate('/perfil');

    useEffect(() => {
        const fuente = perfil?.nombre ? perfil.nombre : sesionNombre;
        const { nombre: n, apellido: a } = separarNombreCompleto(fuente, perfil?.apellido || '');
        setNombre(n);
        setApellido(a);
        if (perfil?.telefono) setTelefono(perfil.telefono);
    }, [perfil, sesionNombre]);

    async function handleGuardar(e: React.FormEvent) {
        e.preventDefault();
        setGuardando(true);
        setError(null);
        try {
            await actualizarPerfil({ nombre, apellido, telefono });
            volver();
        } catch (err: unknown) {
            setError(mensajeError(err, 'No se pudo guardar los cambios. Intenta de nuevo.'));
        } finally {
            setGuardando(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-lg mx-auto p-4 sm:p-6">
                <PageHeader title="Editar Perfil" onBack={volver} />

                {cargando ? (
                    <p className="text-sm text-muted-foreground">Cargando tu perfil...</p>
                ) : (
                    <Card>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-3xl font-bold text-primary">
                                {inicial(nombre || sesionNombre)}
                            </div>
                            {/* El backend todavía no guarda foto de perfil */}
                            <Btn variant="outline" size="sm" disabled>
                                <Camera size={14} />Cambiar foto
                            </Btn>
                        </div>

                        <form className="space-y-4" onSubmit={handleGuardar}>
                            <Input label="Nombre" value={nombre} onChange={setNombre} required placeholder="Ingresa tu nombre" />
                            <Input label="Apellido" value={apellido} onChange={setApellido} required placeholder="Ingresa tu apellido" />
                            <Input label="Teléfono" value={telefono} onChange={setTelefono} type="tel" placeholder="Ingresa tu teléfono" />

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Btn type="submit" disabled={guardando} className="flex-1 justify-center">
                                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                                </Btn>
                                <Btn variant="outline" onClick={volver}>Cancelar</Btn>
                            </div>
                        </form>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
