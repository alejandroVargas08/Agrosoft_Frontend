import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { emailCodesApi, TipoCodigo } from '../api/usuarios/emailCodes';
import AuthLayout from '../componets/RecuperarContrseña/AuthLayout';
import { LuMail, LuLock, LuChevronLeft, LuMailCheck } from 'react-icons/lu';

function RecuperarPassword() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [error, setError] = useState('');
    const [codigoEnviado, setCodigoEnviado] = useState(false);
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            await emailCodesApi.enviarCodigo(correo, TipoCodigo.RESTABLECER_CONTRASENA);
            setCodigoEnviado(true);
        } catch (err) {
            const mensaje = isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje ?? 'Error al enviar el código');
        } finally {
            setCargando(false);
        }
    };

    const inputClasses =
        'w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20';

    return (
        <AuthLayout>
            <Link
                to="/login"
                className="mb-10 flex w-fit items-center gap-1 text-sm text-neutral-500 transition hover:text-green-700"
            >
                <LuChevronLeft size={16} />
                Volver al inicio de sesión
            </Link>

            {!codigoEnviado ? (
                <>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                        <LuLock size={22} className="text-green-700" />
                    </div>
                    <h2 className="mb-1 text-2xl font-bold text-neutral-900">Recuperar contraseña</h2>
                    <p className="mb-8 text-sm text-neutral-500">
                        Ingresa tu correo y te enviaremos un código de recuperación.
                    </p>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-800">Correo electrónico</label>
                            <div className="relative">
                                <LuMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                <input
                                    type="email"
                                    name="correo"
                                    placeholder="usuario@sena.edu.co"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
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
                            {cargando ? 'Enviando...' : 'Enviar código'}
                        </button>
                    </form>
                </>
            ) : (
                <>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                        <LuMailCheck size={22} className="text-green-700" />
                    </div>
                    <h2 className="mb-1 text-2xl font-bold text-neutral-900">Recuperar contraseña</h2>
                    <p className="mb-8 text-sm text-neutral-500">
                        Hemos enviado un código de 6 dígitos a{' '}
                        <strong className="text-neutral-800">{correo}</strong>
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate('/recuperar/verificar', { state: { correo } })}
                        className="w-full rounded-xl bg-green-700 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                        Ingresar código de verificación
                    </button>
                </>
            )}
        </AuthLayout>
    );
}

export default RecuperarPassword;