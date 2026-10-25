import { useMemo, useState, type ElementType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle, BarChart2, CheckCircle, ChevronLeft, Clock, Cpu, FileText, Hash, Key, Lock, Mail, Phone, Sprout, User,
} from 'lucide-react';
import { api } from '../api/axios';
import { mensajeError } from '../api/errores/errores';
import { programasFormacionApi, type ProgramaFormacion } from '../api/programa_formacion/programasFormacion';
import logoAgrosoft from '../assets/img/logo-agrosoft.png';
import logoSena from '../assets/img/logo-sena-blanco.png';

type TipoUsuario = 'aprendiz' | 'instructor' | 'administrador';

interface FormRegistro {
    nombre: string;
    apellido: string;
    identificacion: string;
    telefono: string;
    email: string;
    tipoUsuario: TipoUsuario;
    idFicha: string;
    programaFormacionId: string;
    codigoInstructor: string;
    fichasACargo: string;
    cargo: string;
    motivoSolicitud: string;
    password: string;
    confirmPass: string;
}

interface Resultado {
    aprobado: boolean;
    tipo: TipoUsuario;
    ficha: string | null;
    programa: ProgramaFormacion | null;
}

const FORM_INICIAL: FormRegistro = {
    nombre: '', apellido: '', identificacion: '', telefono: '', email: '',
    tipoUsuario: 'aprendiz', idFicha: '', programaFormacionId: '', codigoInstructor: '',
    fichasACargo: '', cargo: '', motivoSolicitud: '', password: '', confirmPass: '',
};

const TEXTO_ROL: Record<TipoUsuario, string> = { aprendiz: 'Aprendiz', instructor: 'Instructor', administrador: 'Administrador' };

const fieldClass = 'w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';
const selectClass = 'px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';
const labelClass = 'text-sm font-semibold text-foreground';

const etiqueta = (p: ProgramaFormacion) => `${p.nombre} (${p.tipo}) · Ficha ${p.ficha}`;
const separarFichas = (texto: string) => [...new Set(texto.split(/[,\s;]+/).map((f) => f.trim()).filter(Boolean))];

const AuthBrandPanel = () => (
    <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-[#1a4d2e] via-[#2d7a3e] to-[#3a9c50] px-12 py-16 relative overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-8 w-32 h-32 rounded-full bg-white/5" />

        <img src={logoAgrosoft} alt="AgroSoft" className="w-28 h-28 rounded-3xl shadow-2xl mb-6 object-contain" />
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: 'Poppins,sans-serif' }}>AgroSoft</h1>
        <p className="text-white/70 text-base text-center mb-12 max-w-xs leading-relaxed">Sistema de Gestión Agrícola para el Sector Agropecuario</p>

        <div className="space-y-3 w-full max-w-xs">
            {[
                { icon: Sprout, text: 'Unidades productivas y cosechas' },
                { icon: Cpu, text: 'Monitoreo IoT en tiempo real' },
                { icon: BarChart2, text: 'Reportes y análisis de producción' },
            ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                    <Icon size={18} className="text-white/90 shrink-0" />
                    <span className="text-white/85 text-sm font-medium">{text}</span>
                </div>
            ))}
        </div>

        <div className="mt-12 flex items-center gap-3">
            <img src={logoSena} alt="SENA" className="w-10 h-10 object-contain brightness-0 invert" />
            <div>
                <p className="text-white text-xs font-bold tracking-widest uppercase">SENA Colombia</p>
                <p className="text-white/50 text-[10px]">Servicio Nacional de Aprendizaje</p>
            </div>
        </div>
    </div>
);

const MobileHeader = () => (
    <div className="lg:hidden flex flex-col items-center pt-8 pb-6 bg-gradient-to-b from-[#2d7a3e] to-[#3a9c50] px-6">
        <img src={logoAgrosoft} alt="AgroSoft" className="w-16 h-16 rounded-2xl shadow-xl object-contain mb-3" />
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>AgroSoft</h1>
        <div className="flex items-center gap-2 mt-2">
            <img src={logoSena} alt="SENA" className="w-5 h-5 object-contain brightness-0 invert" />
            <span className="text-white/70 text-xs font-semibold tracking-widest uppercase">SENA Colombia</span>
        </div>
    </div>
);

const Pie = () => (
    <div className="px-6 py-4 text-center border-t border-border">
        <p className="text-xs text-muted-foreground">© 2026 AgroSoft — SENA Colombia. Todos los derechos reservados.</p>
    </div>
);

const Campo = ({ label, requerido = false, opcional = false, children }: { label: string; requerido?: boolean; opcional?: boolean; children: ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <label className={labelClass}>
            {label} {requerido && <span className="text-red-500">*</span>}
            {opcional && <span className="text-muted-foreground font-normal">(opcional)</span>}
        </label>
        {children}
    </div>
);

const ConIcono = ({ icon: Icon, children }: { icon: ElementType; children: ReactNode }) => (
    <div className="relative">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        {children}
    </div>
);

const Aviso = ({ children }: { children: ReactNode }) => (
    <div className="p-3 bg-[#FFF3E0] border border-[#F16C07]/30 rounded-xl flex items-start gap-2">
        <AlertCircle size={14} className="text-[#F16C07] mt-0.5 shrink-0" />
        <p className="text-xs text-[#E65100]">{children}</p>
    </div>
);

const PantallaExito = ({ resultado, alSalir }: { resultado: Resultado; alSalir: () => void }) => (
    <div className="min-h-screen grid lg:grid-cols-2">
        <AuthBrandPanel />
        <div className="flex flex-col min-h-screen bg-background">
            <MobileHeader />
            <div className="flex-1 flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-sm text-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${resultado.aprobado ? 'bg-primary/10' : 'bg-[#FFF3E0]'}`}>
                        {resultado.aprobado ? <CheckCircle size={36} className="text-primary" /> : <Clock size={36} className="text-[#F16C07]" />}
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Poppins,sans-serif' }}>
                        {resultado.aprobado ? '¡Tu cuenta está lista!' : 'Solicitud enviada'}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        {resultado.aprobado
                            ? 'Tu cuenta ha sido creada exitosamente. Ya puedes ingresar a AgroSoft.'
                            : 'Un administrador revisará tu solicitud. Podrás iniciar sesión cuando sea aprobada.'}
                    </p>
                    {resultado.aprobado && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-left space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Rol</span>
                                <span className="font-semibold">{TEXTO_ROL[resultado.tipo]}</span>
                            </div>
                            {resultado.ficha && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ficha</span>
                                    <span className="font-mono font-bold text-primary">{resultado.ficha}</span>
                                </div>
                            )}
                            {resultado.programa && (
                                <div className="flex justify-between gap-3 text-sm">
                                    <span className="text-muted-foreground">Programa</span>
                                    <span className="font-semibold text-right max-w-[60%]">{resultado.programa.nombre}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={alSalir}
                        className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/30"
                    >
                        {resultado.aprobado ? 'Iniciar sesión' : 'Volver al inicio'}
                    </button>
                </div>
            </div>
            <Pie />
        </div>
    </div>
);

export const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormRegistro>(FORM_INICIAL);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultado, setResultado] = useState<Resultado | null>(null);

    const programas = useQuery({
        queryKey: ['programas-formacion-activos'],
        queryFn: async () => (await programasFormacionApi.listarActivos()).data,
    });

    const lista = programas.data ?? [];
    const set = (campo: keyof FormRegistro) => (valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

    const programaPorFicha = useMemo(() => new Map(lista.map((p) => [p.ficha.trim(), p])), [lista]);
    const fichaEncontrada = programaPorFicha.get(form.idFicha.trim()) ?? null;
    const fichasInstructor = separarFichas(form.fichasACargo);
    const fichasDesconocidas = fichasInstructor.filter((f) => !programaPorFicha.has(f));

    const cambiarFicha = (valor: string) => {
        const programa = programaPorFicha.get(valor.trim());
        setForm((f) => ({ ...f, idFicha: valor, programaFormacionId: programa ? String(programa.id) : f.programaFormacionId }));
    };

    const cambiarPrograma = (valor: string) => {
        const programa = lista.find((p) => String(p.id) === valor);
        setForm((f) => ({ ...f, programaFormacionId: valor, idFicha: f.tipoUsuario === 'aprendiz' && programa ? programa.ficha : f.idFicha }));
    };

    const validarPaso2 = (): string | null => {
        if (form.tipoUsuario === 'aprendiz') {
            if (!fichaEncontrada) return `La ficha ${form.idFicha.trim()} no está registrada. Pide al administrador que la registre.`;
            if (form.programaFormacionId && String(fichaEncontrada.id) !== form.programaFormacionId) return 'La ficha no corresponde al programa seleccionado';
        }
        if (form.tipoUsuario === 'instructor' && fichasDesconocidas.length > 0) {
            return `Estas fichas no están registradas: ${fichasDesconocidas.join(', ')}`;
        }
        if (form.tipoUsuario === 'administrador' && (!form.cargo.trim() || !form.motivoSolicitud.trim())) {
            return 'Escribe tu cargo y el motivo de la solicitud';
        }
        if (form.password.length < 8) return 'La contraseña debe tener mínimo 8 caracteres';
        if (form.password !== form.confirmPass) return 'Las contraseñas no coinciden';
        return null;
    };

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (step === 1) {
            setStep(2);
            return;
        }

        const problema = validarPaso2();
        if (problema) {
            setError(problema);
            return;
        }

        const programaSeleccionado = lista.find((p) => String(p.id) === form.programaFormacionId) ?? null;
        const programa = form.tipoUsuario === 'aprendiz' ? fichaEncontrada : programaSeleccionado;

        try {
            setEnviando(true);
            const { data } = await api.post<{ requiereAprobacion?: boolean }>('/usuarios', {
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                identificacion: form.identificacion.trim(),
                telefono: form.telefono.trim(),
                email: form.email.trim(),
                password: form.password,
                tipoUsuario: form.tipoUsuario,
                programaFormacionId: programa ? programa.id : undefined,
                idFicha: form.tipoUsuario === 'aprendiz' ? form.idFicha.trim() : undefined,
                codigoInstructor: form.tipoUsuario === 'instructor' && form.codigoInstructor.trim() ? form.codigoInstructor.trim() : undefined,
                fichasACargo: form.tipoUsuario === 'instructor' && fichasInstructor.length > 0 ? fichasInstructor : undefined,
                cargo: form.tipoUsuario === 'administrador' ? form.cargo.trim() : undefined,
                motivoSolicitud: form.tipoUsuario === 'administrador' ? form.motivoSolicitud.trim() : undefined,
            });
            setResultado({
                aprobado: !data.requiereAprobacion,
                tipo: form.tipoUsuario,
                ficha: form.tipoUsuario === 'aprendiz' ? form.idFicha.trim() : null,
                programa,
            });
        } catch (err) {
            setError(mensajeError(err, 'No se pudo crear la cuenta'));
        } finally {
            setEnviando(false);
        }
    };

    if (resultado) return <PantallaExito resultado={resultado} alSalir={() => navigate('/login')} />;

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <AuthBrandPanel />

            <div className="flex flex-col min-h-screen bg-background">
                <MobileHeader />

                <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto">
                    <div className="w-full max-w-sm">
                        <div className="mb-5">
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    if (step === 1) navigate('/login');
                                    else setStep(1);
                                }}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                            >
                                <ChevronLeft size={16} /> {step === 1 ? 'Volver al login' : 'Paso anterior'}
                            </button>
                            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins,sans-serif' }}>Crear cuenta</h2>
                            <p className="text-muted-foreground text-sm mt-1">Paso {step} de 2 — {step === 1 ? 'Datos personales' : 'Formación y seguridad'}</p>
                        </div>

                        <div className="flex gap-1.5 mb-6">
                            <div className="flex-1 h-1.5 rounded-full bg-primary" />
                            <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                        </div>

                        <form onSubmit={enviar} className="space-y-3.5">
                            {step === 1 ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Campo label="Nombre" requerido>
                                            <div className="relative">
                                                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                                <input value={form.nombre} onChange={(e) => set('nombre')(e.target.value)} required placeholder="Carlos" type="text"
                                                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                                            </div>
                                        </Campo>
                                        <Campo label="Apellido" requerido>
                                            <div className="relative">
                                                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                                <input value={form.apellido} onChange={(e) => set('apellido')(e.target.value)} required placeholder="Rivera" type="text"
                                                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                                            </div>
                                        </Campo>
                                    </div>

                                    <Campo label="Identificación" requerido>
                                        <ConIcono icon={FileText}>
                                            <input value={form.identificacion} onChange={(e) => set('identificacion')(e.target.value)} required placeholder="Cédula o TI" type="text" className={fieldClass} />
                                        </ConIcono>
                                    </Campo>

                                    <Campo label="Teléfono" requerido>
                                        <ConIcono icon={Phone}>
                                            <input value={form.telefono} onChange={(e) => set('telefono')(e.target.value)} required placeholder="3001234567" type="tel" className={fieldClass} />
                                        </ConIcono>
                                    </Campo>

                                    <Campo label="Correo electrónico" requerido>
                                        <ConIcono icon={Mail}>
                                            <input value={form.email} onChange={(e) => set('email')(e.target.value)} required placeholder="usuario@sena.edu.co" type="email" className={fieldClass} />
                                        </ConIcono>
                                    </Campo>

                                    <Campo label="Tipo de usuario" requerido>
                                        <select value={form.tipoUsuario} onChange={(e) => set('tipoUsuario')(e.target.value)} className={selectClass}>
                                            <option value="aprendiz">Aprendiz / Usuario</option>
                                            <option value="instructor">Instructor</option>
                                            <option value="administrador">Administrador</option>
                                        </select>
                                    </Campo>
                                </>
                            ) : (
                                <>
                                    {form.tipoUsuario === 'aprendiz' && (
                                        <>
                                            <Campo label="Número de Ficha" requerido>
                                                <ConIcono icon={Hash}>
                                                    <input value={form.idFicha} onChange={(e) => cambiarFicha(e.target.value)} required placeholder="Ej: 2873456" type="text" className={fieldClass} />
                                                </ConIcono>
                                                {fichaEncontrada && (
                                                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle size={11} />Ficha {fichaEncontrada.ficha} · {fichaEncontrada.nombre}
                                                    </p>
                                                )}
                                                {form.idFicha.trim().length > 4 && !fichaEncontrada && !programas.isLoading && (
                                                    <p className="text-xs text-red-600">Esa ficha no está registrada. Pide al administrador que la registre.</p>
                                                )}
                                            </Campo>
                                            <Campo label="Programa de Formación" requerido>
                                                <select value={form.programaFormacionId} onChange={(e) => cambiarPrograma(e.target.value)} required disabled={programas.isLoading} className={selectClass}>
                                                    <option value="">{programas.isLoading ? 'Cargando programas...' : 'Seleccionar programa...'}</option>
                                                    {lista.map((p) => <option key={p.id} value={p.id}>{etiqueta(p)}</option>)}
                                                </select>
                                                {programas.error && <p className="text-xs text-red-600">{mensajeError(programas.error, 'No se pudieron cargar los programas')}</p>}
                                            </Campo>
                                        </>
                                    )}

                                    {form.tipoUsuario === 'instructor' && (
                                        <>
                                            <Campo label="Código de instructor" opcional>
                                                <ConIcono icon={Key}>
                                                    <input value={form.codigoInstructor} onChange={(e) => set('codigoInstructor')(e.target.value)} placeholder="Código otorgado por la coordinación" type="text" className={fieldClass} />
                                                </ConIcono>
                                            </Campo>
                                            <Campo label="Fichas a cargo" opcional>
                                                <ConIcono icon={Hash}>
                                                    <input value={form.fichasACargo} onChange={(e) => set('fichasACargo')(e.target.value)} placeholder="Ej: 2873456, 2901234" type="text" className={fieldClass} />
                                                </ConIcono>
                                                {fichasInstructor.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {fichasInstructor.map((f) => (
                                                            <span
                                                                key={f}
                                                                title={programaPorFicha.get(f)?.nombre ?? 'Ficha no registrada'}
                                                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${programaPorFicha.has(f) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                                            >
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </Campo>
                                            <Campo label="Programa de Formación" opcional>
                                                <select value={form.programaFormacionId} onChange={(e) => cambiarPrograma(e.target.value)} className={selectClass}>
                                                    <option value="">Seleccionar programa...</option>
                                                    {lista.map((p) => <option key={p.id} value={p.id}>{etiqueta(p)}</option>)}
                                                </select>
                                            </Campo>
                                            <Aviso>Sin código, tu cuenta queda pendiente de aprobación por el administrador.</Aviso>
                                        </>
                                    )}

                                    {form.tipoUsuario === 'administrador' && (
                                        <>
                                            <Campo label="Cargo" requerido>
                                                <ConIcono icon={User}>
                                                    <input value={form.cargo} onChange={(e) => set('cargo')(e.target.value)} required placeholder="Ej: Coordinador académico" type="text" className={fieldClass} />
                                                </ConIcono>
                                            </Campo>
                                            <Campo label="Motivo de la solicitud" requerido>
                                                <textarea
                                                    value={form.motivoSolicitud}
                                                    onChange={(e) => set('motivoSolicitud')(e.target.value.slice(0, 500))}
                                                    required
                                                    rows={3}
                                                    placeholder="Describe por qué necesitas acceso de administrador..."
                                                    className={`${selectClass} resize-none`}
                                                />
                                            </Campo>
                                            <Aviso>Un administrador debe aprobar tu cuenta antes de que puedas ingresar.</Aviso>
                                        </>
                                    )}

                                    <Campo label="Contraseña" requerido>
                                        <ConIcono icon={Lock}>
                                            <input value={form.password} onChange={(e) => set('password')(e.target.value)} required placeholder="Mínimo 8 caracteres" type="password" className={fieldClass} />
                                        </ConIcono>
                                    </Campo>

                                    <Campo label="Confirmar contraseña" requerido>
                                        <ConIcono icon={Lock}>
                                            <input value={form.confirmPass} onChange={(e) => set('confirmPass')(e.target.value)} required placeholder="Repite la contraseña" type="password" className={fieldClass} />
                                        </ConIcono>
                                    </Campo>
                                </>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={enviando}
                                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm shadow-primary/30 mt-1 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {enviando ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando cuenta...</>
                                ) : step === 1 ? 'Continuar' : 'Crear cuenta'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground mt-5">
                            ¿Ya tienes cuenta?{' '}
                            <button type="button" onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline">
                                Iniciar sesión
                            </button>
                        </p>
                    </div>
                </div>

                <Pie />
            </div>
        </div>
    );
};
