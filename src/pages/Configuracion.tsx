import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, HelpCircle, ShieldCheck, LogOut, ChevronRight, X, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 ${
        checked ? 'bg-green-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function Configuracion() {
  const navigate = useNavigate();

  const [twoFactor, setTwoFactor] = useState(false);
  const [telegramVinculado, setTelegramVinculado] = useState(false);
  const [notifSensores, setNotifSensores] = useState(true);
  const [notifStock, setNotifStock] = useState(true);
  const [notifActividades, setNotifActividades] = useState(true);
  const [notifIncidencias, setNotifIncidencias] = useState(true);

  const [mostrarModalTelegram, setMostrarModalTelegram] = useState(false);
  const [codigoVinculacion, setCodigoVinculacion] = useState('A4F-8K2');
  const [cargandoCodigo, setCargandoCodigo] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);
  const [errorTelegram, setErrorTelegram] = useState<string | null>(null);

  const botTelegramUsername = 'AgroSoftSenaBot';

  useEffect(() => {
    const saved = localStorage.getItem('agrosoft_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.twoFactor !== undefined) setTwoFactor(parsed.twoFactor);
        if (parsed.telegramVinculado !== undefined) setTelegramVinculado(parsed.telegramVinculado);
        if (parsed.notifSensores !== undefined) setNotifSensores(parsed.notifSensores);
        if (parsed.notifStock !== undefined) setNotifStock(parsed.notifStock);
        if (parsed.notifActividades !== undefined) setNotifActividades(parsed.notifActividades);
        if (parsed.notifIncidencias !== undefined) setNotifIncidencias(parsed.notifIncidencias);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const actualizarPreferencia = (clave: string, valor: boolean) => {
    if (clave === 'twoFactor') setTwoFactor(valor);
    if (clave === 'notifSensores') setNotifSensores(valor);
    if (clave === 'notifStock') setNotifStock(valor);
    if (clave === 'notifActividades') setNotifActividades(valor);
    if (clave === 'notifIncidencias') setNotifIncidencias(valor);

    try {
      const current = JSON.parse(localStorage.getItem('agrosoft_config') || '{}');
      localStorage.setItem('agrosoft_config', JSON.stringify({ ...current, [clave]: valor }));
      
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/configuracion', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ [clave]: valor })
        }).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generarNuevoCodigo = () => {
    setCargandoCodigo(true);
    setErrorTelegram(null);
    setTimeout(() => {
      const parte1 = Math.random().toString(36).substring(2, 5).toUpperCase();
      const parte2 = Math.random().toString(36).substring(2, 5).toUpperCase();
      setCodigoVinculacion(`${parte1}-${parte2}`);
      setCargandoCodigo(false);
    }, 300);
  };

  const handleAbrirModalTelegram = () => {
    generarNuevoCodigo();
    setMostrarModalTelegram(true);
  };

  const handleIrATelegram = () => {
    window.open(`https://t.me/${botTelegramUsername}?start=${codigoVinculacion}`, '_blank');
    setTelegramVinculado(true);
    const current = JSON.parse(localStorage.getItem('agrosoft_config') || '{}');
    localStorage.setItem('agrosoft_config', JSON.stringify({ ...current, telegramVinculado: true }));
    setMostrarModalTelegram(false);
  };

  const handleDesvincularTelegram = () => {
    setDesvinculando(true);
    setTimeout(() => {
      setTelegramVinculado(false);
      const current = JSON.parse(localStorage.getItem('agrosoft_config') || '{}');
      localStorage.setItem('agrosoft_config', JSON.stringify({ ...current, telegramVinculado: false }));
      setDesvinculando(false);
    }, 300);
  };

  const handleCerrarSesion = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <DashboardLayout unreadNotifications={2}>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Configuración
          </h1>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              Privacidad y Seguridad
            </h2>
            <div className="divide-y divide-gray-100">
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-semibold text-gray-800">
                    Verificación en dos pasos
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Código por correo al iniciar sesión
                  </p>
                </div>
                <Switch 
                  checked={twoFactor} 
                  onChange={(val) => actualizarPreferencia('twoFactor', val)} 
                />
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-semibold text-gray-800">
                    Vincular con Telegram
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {telegramVinculado ? 'Cuenta vinculada' : 'Recibe notificaciones en Telegram'}
                  </p>
                </div>
                {telegramVinculado ? (
                  <button
                    type="button"
                    disabled={desvinculando}
                    onClick={handleDesvincularTelegram}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs sm:text-sm font-medium transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {desvinculando && <Loader2 size={14} className="animate-spin" />}
                    Desconectar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAbrirModalTelegram}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium transition-colors shrink-0 shadow-sm cursor-pointer"
                  >
                    <Send size={14} className="text-gray-500" />
                    Vincular
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              Notificaciones
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700">Alertas de sensores</span>
                <Switch 
                  checked={notifSensores} 
                  onChange={(val) => actualizarPreferencia('notifSensores', val)} 
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700">Stock bajo</span>
                <Switch 
                  checked={notifStock} 
                  onChange={(val) => actualizarPreferencia('notifStock', val)} 
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700">Actividades vencidas</span>
                <Switch 
                  checked={notifActividades} 
                  onChange={(val) => actualizarPreferencia('notifActividades', val)} 
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700">Nuevas incidencias</span>
                <Switch 
                  checked={notifIncidencias} 
                  onChange={(val) => actualizarPreferencia('notifIncidencias', val)} 
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">Cuenta</h2>
            <div className="divide-y divide-gray-100">
              <button
                type="button"
                onClick={() => navigate('/ayuda')}
                className="w-full py-3.5 flex items-center justify-between text-left hover:bg-gray-50/50 rounded-lg px-2 -mx-2 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={18} className="text-gray-400 group-hover:text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    Centro de ayuda
                  </span>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/privacidad')}
                className="w-full py-3.5 flex items-center justify-between text-left hover:bg-gray-50/50 rounded-lg px-2 -mx-2 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-gray-400 group-hover:text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    Política de privacidad
                  </span>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
              </button>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleCerrarSesion}
                  className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors py-2 px-2 -mx-2 rounded-lg hover:bg-red-50 cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {mostrarModalTelegram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Vincular Telegram
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModalTelegram(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                <Send size={24} className="-ml-0.5 mt-0.5 text-blue-500" />
              </div>

              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Usa este código en el bot{' '}
                <span className="font-semibold text-gray-900">
                  @{botTelegramUsername}
                </span>{' '}
                para vincular tu cuenta
              </p>

              <div className="w-full bg-[#f4f8f4] border border-green-100 rounded-xl py-4 px-6 mb-6 relative">
                {cargandoCodigo ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 size={24} className="animate-spin text-green-700" />
                  </div>
                ) : (
                  <>
                    <span className="block text-2xl sm:text-3xl font-bold tracking-widest text-[#15803d]">
                      {codigoVinculacion}
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">
                      Expira en 10 minutos
                    </span>
                    <button
                      type="button"
                      onClick={generarNuevoCodigo}
                      className="absolute right-3 top-3 text-gray-400 hover:text-green-700 p-1 transition-colors cursor-pointer"
                      title="Generar nuevo código"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </>
                )}
              </div>

              {errorTelegram && (
                <div className="w-full mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {errorTelegram}
                </div>
              )}

              <button
                type="button"
                disabled={cargandoCodigo}
                onClick={handleIrATelegram}
                className="w-full bg-[#1e6f3d] hover:bg-[#185830] disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <ExternalLink size={16} />
                Ir a Telegram
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

