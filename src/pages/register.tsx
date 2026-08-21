import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';
import logoAgrosoft from '../assets/img/logo-agrosoft.png';
import logoSena from '../assets/img/logo-sena-blanco.png';
import {
    LuSprout,
    LuCpu,
    LuUser,
    LuIdCard,
    LuPhone,
    LuMail,
    LuGraduationCap,
    LuLock,
    LuHash,
    LuAsterisk,
    LuChevronLeft,
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';

export const Register = () => {
    // Estado para controlar el paso actual (1 o 2)
    const [step, setStep] = useState(1);

    // Estado para guardar los datos del formulario completo
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        identificacion: '',
        telefono: '',
        email: '',
        rolId: '1',
        programaFormacionId: '',
        idFicha: '',
        password: '',
        confirmarPassword: '',
    });

    // Manejador de cambios universal para inputs y selects
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // Avanzar al paso 2 validando primero el paso 1
    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    // Regresar al paso 1
    const handlePrevStep = () => {
        setStep(1);
    };

    // Envío final a la API
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password !== form.confirmarPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        try {
            const datos = {
                nombre: form.nombre,
                apellido: form.apellido,
                identificacion: form.identificacion,
                telefono: form.telefono,
                email: form.email,
                rolId: Number(form.rolId),
                programaFormacionId: form.programaFormacionId
                    ? Number(form.programaFormacionId)
                    : undefined,
                idFicha: form.idFicha || undefined,
                password: form.password,
            };
            const response = await api.post('/usuarios', datos);
            alert('¡Usuario registrado con éxito!');
            console.log(response.data);

        } catch (error) {
            alert('Error al registrar usuario');
            console.log(error);
        }
    };

    const inputClasses =
        'w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20';

    const selectClasses =
        'w-full rounded-xl border border-neutral-200 bg-white py-3 pl-4 pr-4 text-sm text-neutral-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20';

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

            {/* Panel Derecho - Dinámico según el paso */}
            <main className="flex w-full flex-1 flex-col bg-neutral-50 px-6 py-10 lg:w-1/2 lg:px-16 lg:py-16">
                <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
                    <header className="mb-8">
                        {step === 1 ? (
                            <Link
                                to="/login"
                                className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-green-700"
                            >
                                <LuChevronLeft size={16} /> Volver al login
                            </Link>
                        ) : (
                            <button
                                type="button"
                                className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-green-700"
                                onClick={handlePrevStep}
                            >
                                <LuChevronLeft size={16} /> Paso anterior
                            </button>
                        )}

                        <h2 className="mb-1 text-3xl font-extrabold text-neutral-900">Crear cuenta</h2>
                        <p className="mb-4 text-neutral-500">
                            {step === 1
                                ? 'Paso 1 de 2 — Datos personales'
                                : 'Paso 2 de 2 — Formación y seguridad'}
                        </p>

                        {/* Barra de Progreso */}
                        <div className="flex h-1.5 w-full gap-2">
                            <div className="h-full flex-1 rounded-full bg-green-700" />
                            <div
                                className={`h-full flex-1 rounded-full ${step === 2 ? 'bg-green-700' : 'bg-neutral-200'
                                    }`}
                            />
                        </div>
                    </header>

                    {/* PASO 1: DATOS PERSONALES */}
                    {step === 1 && (
                        <form className="flex flex-col gap-5" onSubmit={handleNextStep}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-neutral-800">
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <LuUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                        <input
                                            type="text"
                                            name="nombre"
                                            placeholder="Carlos"
                                            value={form.nombre}
                                            onChange={handleChange}
                                            required
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-neutral-800">
                                        Apellido <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <LuUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                        <input
                                            type="text"
                                            name="apellido"
                                            placeholder="Rivera"
                                            value={form.apellido}
                                            onChange={handleChange}
                                            required
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-800">
                                    Identificación <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <LuIdCard className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        type="text"
                                        name="identificacion"
                                        placeholder="Cédula o TI"
                                        value={form.identificacion}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-800">
                                    Teléfono <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <LuPhone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        type="tel"
                                        name="telefono"
                                        placeholder="3001234567"
                                        value={form.telefono}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-800">
                                    Correo electrónico <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <LuMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="usuario@sena.edu.co"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-800">
                                    Tipo de usuario <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="rolId"
                                    value={form.rolId}
                                    onChange={handleChange}
                                    className={selectClasses}
                                >
                                    <option value="1">Aprendiz / Usuario</option>
                                    <option value="2">Administrador</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="mt-2 w-full rounded-xl bg-green-800 py-3.5 font-semibold text-white transition hover:bg-green-900"
                            >
                                Continuar
                            </button>
                        </form>
                    )}

                    {/* PASO 2: FORMACIÓN Y SEGURIDAD */}
                    {step === 2 && (
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                                <LuGraduationCap size={18} className="shrink-0" />
                                <span>Los campos de formación SENA son opcionales</span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-800">
                                    Programa de Formación <span className="text-neutral-400 font-normal">(opcional)</span>
                                </label>
                                <select
                                    name="programaFormacionId"
                                    value={form.programaFormacionId}
                                    onChange={handleChange}
                                    className={selectClasses}
                                >
                                    <option value="">Sin programa asignado</option>
                                    <option value="1">ADSO - Análisis y Desarrollo de Software</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-800">
                                    Número de Ficha <span className="text-neutral-400 font-normal">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <LuHash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        type="text"
                                        name="idFicha"
                                        placeholder="Ej: 2756431"
                                        value={form.idFicha}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-800">
                                    Contraseña <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <LuLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Mínimo 8 caracteres"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-800">
                                    Confirmar contraseña <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <LuLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        type="password"
                                        name="confirmarPassword"
                                        placeholder="Repite la contraseña"
                                        value={form.confirmarPassword}
                                        onChange={handleChange}
                                        required
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="mt-2 w-full rounded-xl bg-green-800 py-3.5 font-semibold text-white transition hover:bg-green-900"
                            >
                                Crear cuenta
                            </button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-neutral-600">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="font-semibold text-green-700 hover:underline">
                            Iniciar sesión
                        </Link>
                    </p>

                    <footer className="mt-10 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
                        © 2026 AgroSoft — SENA Colombia. Todos los derechos reservados.
                    </footer>
                </div>
            </main>
        </div>
    );
};
