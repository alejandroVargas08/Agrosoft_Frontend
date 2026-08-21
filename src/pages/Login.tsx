import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { api } from '../api/axios';
import logoAgrosoft from '../assets/img/logo-agrosoft.png';
import logoSena from '../assets/img/logo-sena-blanco.png';
import {
    LuSprout,
    LuCpu,
    LuMail,
    LuLock,
    LuEye,
    LuEyeOff,
    LuAsterisk,
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';

function Login() {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setExito('');

        try {
            const { data } = await api.post('/usuarios/login', { correo, password });
            console.log('Usuario logueado:', data);
            setExito('Inicio de sesión excelente');
        } catch (err) {
            const mensaje = isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(mensaje ?? 'Error al iniciar sesión');
            setExito('');
        }
    };

    const inputClasses =
        'w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-10 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20';

    return (
        <div className="flex min-h-screen w-full flex-col lg:flex-row">
            {/* Panel Izquierdo - Branding Persistente */}
            <aside className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-green-900 px-6 py-8 lg:sticky lg:top-0 lg:h-screen lg:w-1/2 lg:px-12 lg:py-16">
                {/* Blobs decorativos */}
                <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-white/5" />

                {/* Versión compacta (móvil pequeño) */}
                <div className="relative z-10 flex flex-col items-center gap-2 sm:hidden">
                    <img src={logoAgrosoft} alt="logoAgrosoft" className="h-14 w-14" />
                    <h1 className="text-xl font-extrabold text-white">AgroSoft</h1>
                    <div className="flex items-center gap-1.5 text-green-100">
                        <LuAsterisk size={12} />
                        <span className="text-xs font-semibold tracking-wide">SENA COLOMBIA</span>
                    </div>
                </div>

                {/* Versión completa (tablet / escritorio) */}
                <div className="relative z-10 hidden max-w-sm flex-col items-center pt-20 text-center sm:flex">
                    <img src={logoAgrosoft} alt="logoAgrosoft" className="mb-8 h-[120px] w-[120px]" />
                    <h1 className="mb-4 text-5xl font-extrabold text-white">AgroSoft</h1>
                    <p className="mb-10 text-green-100">
                        Sistema de Gestión Agrícola para el Sector Agropecuario
                    </p>

                    <div className="flex w-full max-w-md flex-col gap-4">
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-4 text-left">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                <LuSprout color="white" size={20} />
                            </div>
                            <span className="font-medium text-white">Unidades productivas y cosechas</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-4 text-left">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                <LuCpu color="white" size={20} />
                            </div>
                            <span className="font-medium text-white">Monitoreo IoT en tiempo real</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-4 text-left">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                <FiBarChart2 color="white" size={20} />
                            </div>
                            <span className="font-medium text-white">Reportes y análisis de producción</span>
                        </div>
                    </div>

                    <div className="mt-10 flex items-center">
                        <img src={logoSena} alt="logoSena" className="-mr-4 h-14 w-22" />
                        <div className="flex flex-col items-start text-left">
                            <strong className="text-white">SENA COLOMBIA</strong>
                            <small className="text-green-200">Servicio Nacional de Aprendizaje</small>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Panel Derecho - Formulario de acceso */}
            <main className="flex w-full flex-1 flex-col bg-neutral-50 px-6 py-10 lg:w-1/2 lg:justify-center lg:px-16 lg:py-16">
                <div className="mx-auto flex w-full max-w-lg flex-1 flex-col lg:justify-center">
                    <header className="mb-8">
                        <h2 className="mb-1 text-3xl font-extrabold text-neutral-900">Bienvenido</h2>
                        <p className="text-neutral-500">Inicia sesión en tu cuenta</p>
                    </header>

                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-neutral-800">Contraseña</label>
                            <div className="relative">
                                <LuLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                <input
                                    type={mostrarPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={inputClasses}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {mostrarPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <p className="text-right text-sm">
                            <a href="#" className="font-semibold text-green-700 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </p>

                        {exito && <p className="text-sm font-medium text-green-700">{exito}</p>}
                        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

                        <button
                            type="submit"
                            className="mt-2 w-full rounded-xl bg-green-800 py-3.5 font-semibold text-white transition hover:bg-green-900"
                        >
                            Iniciar Sesión
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-neutral-600">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="font-semibold text-green-700 hover:underline">
                            Regístrate aquí
                        </Link>
                    </p>

                    <footer className="mt-10 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
                        © 2026 AgroSoft — SENA Colombia. Todos los derechos reservados.
                    </footer>
                </div>
            </main>
        </div>
    );
}

export default Login;
