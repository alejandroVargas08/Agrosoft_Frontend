import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { emailCodesApi, TipoCodigo } from '../api/usuarios/emailCodes';
import AuthLayout from '../componets/RecuperarContrseña/AuthLayout';
import { LuMail } from 'react-icons/lu';

function VerificarCodigo() {
    const navigate = useNavigate();
    const location = useLocation();
    const correo = (location.state as { correo?: string })?.correo ?? '';

    const [digitos, setDigitos] = useState<string[]>(Array(6).fill(''));
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [reenviando, setReenviando] = useState(false);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!correo) {
            navigate('/recuperar', { replace: true });
        }
    }, [correo, navigate]);

    const handleChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;

        const nuevos = [...digitos];
        nuevos[index] = value;
        setDigitos(nuevos);

        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digitos[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const texto = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(texto)) {
            setDigitos(texto.split(''));
            inputsRef.current[5]?.focus();
        }
        e.preventDefault();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const codigo = digitos.join('');
        if (codigo.length !== 6) {
            setError('Ingresa los 6 dígitos del código');
            return;
        }

        setCargando(true);
        try {
            await emailCodesApi.verificarCodigo(correo, codigo, TipoCodigo.RESTABLECER_CONTRASENA);
            navigate('/recuperar/nueva-contrasena', { state: { correo, codigo } });
        } catch (err) {
            const mensaje = isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje ?? 'Código inválido o expirado');
        } finally {
            setCargando(false);
        }
    };

    const handleReenviar = async () => {
        setError('');
        setReenviando(true);
        try {
            await emailCodesApi.enviarCodigo(correo, TipoCodigo.RESTABLECER_CONTRASENA);
            setDigitos(Array(6).fill(''));
            inputsRef.current[0]?.focus();
        } catch {
            setError('No se pudo reenviar el código, intenta de nuevo');
        } finally {
            setReenviando(false);
        }
    };

    return (
        <AuthLayout>
            <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
                    <LuMail size={28} className="text-green-700" />
                </div>

                <h2 className="mb-2 text-2xl font-bold text-neutral-900">Verifica tu correo</h2>
                <p className="mb-8 text-sm text-neutral-500">
                    Ingresa el código de 6 dígitos enviado a tu correo electrónico
                </p>

                <form className="flex w-full flex-col items-center gap-6" onSubmit={handleSubmit}>
                    <div className="flex justify-center gap-2.5">
                        {digitos.map((digito, index) => (
                            <input
                                key={index}
                                ref={(el) => {
                                    inputsRef.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digito}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="h-14 w-12 rounded-xl border border-neutral-200 text-center text-xl font-semibold text-neutral-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
                            />
                        ))}
                    </div>

                    {error && <p className="text-sm font-medium text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full rounded-xl bg-green-700 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cargando ? 'Verificando...' : 'Verificar código'}
                    </button>

                    <p className="text-sm text-neutral-500">
                        ¿No recibiste el código?{' '}
                        <button
                            type="button"
                            onClick={handleReenviar}
                            disabled={reenviando}
                            className="font-semibold text-green-700 hover:text-green-800 disabled:opacity-60"
                        >
                            {reenviando ? 'Enviando...' : 'Reenviar código'}
                        </button>
                    </p>

                    <Link to="/login" className="text-sm text-neutral-400 transition hover:text-neutral-600">
                        Volver al inicio de sesión
                    </Link>
                </form>
            </div>
        </AuthLayout>
    );
}

export default VerificarCodigo;