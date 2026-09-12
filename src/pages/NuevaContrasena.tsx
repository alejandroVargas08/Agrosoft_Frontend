import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { emailCodesApi } from '../api/usuarios/emailCodes';
import AuthLayout from '../componets/RecuperarContrseña/AuthLayout';
import { LuLock, LuCircleCheck } from 'react-icons/lu';

function NuevaContrasena() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { correo?: string; codigo?: string } | null;
    const correo = state?.correo ?? '';
    const codigo = state?.codigo ?? '';

    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);
    const [cargando, setCargando] = useState(false);


    useEffect(() => {
        if (!correo || !codigo) {
            navigate('/recuperar', { replace: true });
        }
    }, [correo, codigo, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (nuevaContrasena.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (nuevaContrasena !== confirmarContrasena) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setCargando(true);
        try {
            await emailCodesApi.restablecerContrasena(correo, codigo, nuevaContrasena);
            setExito(true);
            setTimeout(() => navigate('/login', { replace: true }), 2500);
        } catch (err) {
            const mensaje = isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje ?? 'Error al restablecer la contraseña');
        } finally {
            setCargando(false);
        }
    };

    const inputClasses =
        'w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20';

    if (exito) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
                        <LuCircleCheck size={28} className="text-green-700" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-neutral-900">Contraseña actualizada</h2>
                    <p className="mb-2 text-sm text-neutral-500">
                        Tu contraseña se cambió correctamente. Te llevaremos al inicio de sesión.
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
                    <LuLock size={28} className="text-green-700" />
                </div>

                <h2 className="mb-2 text-2xl font-bold text-neutral-900">Crea una nueva contraseña</h2>
                <p className="mb-8 text-sm text-neutral-500">
                    Debe tener al menos 8 caracteres. Usa una contraseña segura que no hayas usado antes.
                </p>

                <form className="flex w-full flex-col gap-4 text-left" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-800">Nueva contraseña</label>
                        <div className="relative">
                            <LuLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="password"
                                value={nuevaContrasena}
                                onChange={(e) => setNuevaContrasena(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                required
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-neutral-800">Confirmar contraseña</label>
                        <div className="relative">
                            <LuLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="password"
                                value={confirmarContrasena}
                                onChange={(e) => setConfirmarContrasena(e.target.value)}
                                placeholder="Repite la contraseña"
                                required
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm font-medium text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={cargando}
                        className="mt-1 w-full rounded-xl bg-green-700 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cargando ? 'Guardando...' : 'Restablecer contraseña'}
                    </button>

                    <Link to="/login" className="text-center text-sm text-neutral-400 transition hover:text-neutral-600">
                        Volver al inicio de sesión
                    </Link>
                </form>
            </div>
        </AuthLayout>
    );
}

export default NuevaContrasena;