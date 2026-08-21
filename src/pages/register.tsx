import React, { useState } from 'react';
import { api } from '../api/axios';
import logoAgrosoft from '../assets/logo-agrosoft.png';
import logoSena from '../assets/logo-sena.png';
import { LuSprout, LuCpu, LuUser, LuIdCard, LuPhone, LuMail, LuGraduationCap, LuLock, LuHash } from 'react-icons/lu';
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

    return (
        <div className='RegisterContainer'>
            {/* Panel Izquierdo - Branding Persistente */}
            <aside className='PanelIzquierdo'>
                <img src={logoAgrosoft} alt="logoAgrosoft" />
                <h1>AgroSoft</h1>
                <p>Sistema de Gestión Agrícola para el Sector Agropecuario</p>

                <div className='listaPanel'>
                    <div className="itemLista">
                        <div className="icon-container"><LuSprout color="white" size={24} /></div>
                        <span>Unidades productivas y cosechas</span>
                    </div>
                    <div className="itemLista">
                        <div className="icon-container"><LuCpu color="white" size={24} /></div>
                        <span>Monitoreo IoT en tiempo real</span>
                    </div>
                    <div className="itemLista">
                        <div className="icon-container"><FiBarChart2 color="white" size={24} /></div>
                        <span>Reportes y análisis de producción</span>
                    </div>
                </div>

                <div className='footerPanel'>
                    <img src={logoSena} alt="logoSena" />
                    <strong>SENA COLOMBIA</strong>
                    <small>Servicio Nacional de Aprendizaje</small>
                </div>
            </aside>

            {/* Panel Derecho - Dinámico según el paso */}
            <main className='formularioRegistro'>
                <header className='headerFormulario'>
                    {step === 1 ? (
                        <a href="/login" className="back-link">&lt; Volver al login</a>
                    ) : (
                        <button type="button" className="back-link-btn" onClick={handlePrevStep}>
                            &lt; Paso anterior
                        </button>
                    )}

                    <h2>Crear cuenta</h2>
                    <p>
                        {step === 1 
                            ? 'Paso 1 de 2 — Datos personales' 
                            : 'Paso 2 de 2 — Formación y seguridad'}
                    </p>

                    {/* Barra de Progreso */}
                    <div className="progress-bar">
                        <div className={`progress-fill step-${step}`}></div>
                    </div>
                </header>

                {/* PASO 1: DATOS PERSONALES */}
                {step === 1 && (
                    <form className='register-form' onSubmit={handleNextStep}>
                        <div className="form-row">
                            <div className="input-group">
                                <label>Nombre *</label>
                                <div className="input-field">
                                    <LuUser className="input-icon" />
                                    <input
                                        type="text"
                                        name='nombre'
                                        placeholder='Carlos'
                                        value={form.nombre}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Apellido *</label>
                                <div className="input-field">
                                    <LuUser className="input-icon" />
                                    <input
                                        type="text"
                                        name='apellido'
                                        placeholder='Rivera'
                                        value={form.apellido}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Identificación *</label>
                            <div className="input-field">
                                <LuIdCard className="input-icon" />
                                <input
                                    type="text"
                                    name='identificacion'
                                    placeholder='Cédula o TI'
                                    value={form.identificacion}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Teléfono *</label>
                            <div className="input-field">
                                <LuPhone className="input-icon" />
                                <input
                                    type="tel"
                                    name='telefono'
                                    placeholder='3001234567'
                                    value={form.telefono}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Correo electrónico *</label>
                            <div className="input-field">
                                <LuMail className="input-icon" />
                                <input
                                    type="email"
                                    name='email'
                                    placeholder='usuario@sena.edu.co'
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Tipo de usuario *</label>
                            <div className="input-field">
                                <select 
                                    name="rolId" 
                                    value={form.rolId} 
                                    onChange={handleChange}
                                >
                                    <option value="1">Aprendiz / Usuario</option>
                                    <option value="2">Administrador</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary">Continuar</button>
                    </form>
                )}

                {/* PASO 2: FORMACIÓN Y SEGURIDAD */}
                {step === 2 && (
                    <form className='register-form' onSubmit={handleSubmit}>
                        <div className="info-banner">
                            <LuGraduationCap />
                            <span>Los campos de formación SENA son opcionales</span>
                        </div>

                        <div className="input-group">
                            <label>Programa de Formación (opcional)</label>
                            <div className="input-field">
                                <select 
                                    name="programaFormacionId" 
                                    value={form.programaFormacionId} 
                                    onChange={handleChange}
                                >
                                    <option value="">Sin programa asignado</option>
                                    <option value="1">ADSO - Análisis y Desarrollo de Software</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Número de Ficha (opcional)</label>
                            <div className="input-field">
                                <LuHash className="input-icon" />
                                <input
                                    type="text"
                                    name='idFicha'
                                    placeholder='Ej: 2756431'
                                    value={form.idFicha}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Contraseña *</label>
                            <div className="input-field">
                                <LuLock className="input-icon" />
                                <input
                                    type="password"
                                    name='password'
                                    placeholder='Mínimo 8 caracteres'
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Confirmar contraseña *</label>
                            <div className="input-field">
                                <LuLock className="input-icon" />
                                <input
                                    type="password"
                                    name='confirmarPassword'
                                    placeholder='Repite la contraseña'
                                    value={form.confirmarPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary">Crear cuenta</button>
                    </form>
                )}

                <p className="login-redirect">
                    ¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a>
                </p>

                <footer className="form-footer">
                    © 2026 AgroSoft — SENA Colombia. Todos los derechos reservados.
                </footer>
            </main>
        </div>
    );
};