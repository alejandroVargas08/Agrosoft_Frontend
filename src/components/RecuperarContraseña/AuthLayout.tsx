import logoSena from '../../assets/img/logo-sena-blanco.png';
import { LuSprout, LuCpu } from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';

interface AuthLayoutProps {
    children: React.ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen w-full flex-col lg:flex-row">
            {/* Panel Izquierdo - Branding */}
            <aside className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-green-900 px-6 py-10 lg:sticky lg:top-0 lg:h-screen lg:w-1/2 lg:px-12">
                <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-white/5" />

                <div className="relative z-10 flex flex-col items-center gap-2 sm:hidden">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                        <LuSprout color="white" size={28} />
                    </div>
                    <h1 className="text-xl font-extrabold text-white">AgroSoft</h1>
                    <span className="text-xs font-semibold tracking-wide text-green-100">SENA COLOMBIA</span>
                </div>

                <div className="relative z-10 hidden w-full max-w-sm flex-col items-center text-center sm:flex">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
                        <LuSprout color="white" size={40} />
                    </div>
                    <h1 className="mb-2 text-4xl font-extrabold text-white">AgroSoft</h1>
                    <p className="mb-8 text-sm leading-relaxed text-green-100">
                        Sistema de Gestión Agrícola para el Sector Agropecuario
                    </p>

                    <div className="flex w-full flex-col gap-3">
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-left">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                <LuSprout color="white" size={18} />
                            </div>
                            <span className="text-sm font-medium text-white">Unidades productivas y cosechas</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-left">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                <LuCpu color="white" size={18} />
                            </div>
                            <span className="text-sm font-medium text-white">Monitoreo IoT en tiempo real</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-left">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                <FiBarChart2 color="white" size={18} />
                            </div>
                            <span className="text-sm font-medium text-white">Reportes y análisis de producción</span>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-3">
                        <img src={logoSena} alt="logoSena" className="h-10 w-auto" />
                        <div className="flex flex-col items-start text-left">
                            <strong className="text-sm text-white">SENA COLOMBIA</strong>
                            <small className="text-xs text-green-200">Servicio Nacional de Aprendizaje</small>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Panel Derecho - Contenido */}
            <main className="flex w-full flex-1 flex-col bg-white px-6 py-8 lg:w-1/2 lg:px-16">
                <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:justify-center">
                    {children}
                </div>

                <footer className="mx-auto w-full max-w-md pt-6 text-center text-xs text-neutral-400">
                    © 2026 AgroSoft — SENA Colombia. Todos los derechos reservados.
                </footer>
            </main>
        </div>
    );
}

export default AuthLayout;