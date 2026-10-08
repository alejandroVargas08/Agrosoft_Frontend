import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Sprout, Map, ClipboardList, AlertTriangle, FlaskConical, Package, ShoppingCart, BookOpen, Radio, BarChart3, Bell, History, User, Settings, X, ChevronDown, LogOut, Bot, Leaf } from "lucide-react";
import logoAgrosoft from "../../assets/img/logo-agrosoft.png";
import { cerrarSesion } from "../../hooks/useAuth";

interface SubItem {
    label: string;
    path: string;
}
interface MenuItem {
    icon: React.ElementType;
    label: string;
    path: string;
    children?: SubItem[];
}
interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const mainItems: MenuItem[] = [
    { icon: Home, label: 'Inicio', path: '/inicio' },
    { icon: Sprout, label: 'Unidades Productivas', path: '/unidades-productivas' },
    { icon: Leaf, label: 'cultivos', path: '/cultivos' },
    { icon: Map, label: 'Lotes y Sublotes', path: '/territorio' },
    { icon: ClipboardList, label: 'Actividades', path: '/actividades' },
    { icon: AlertTriangle, label: 'Incidencias', path: '/incidencias' },
    { icon: FlaskConical, label: 'Tratamientos', path: '/tratamientos' },
    { icon: Package, label: 'Inventario', path: '/inventario' },
    { icon: ShoppingCart, label: 'Ventas', path: '/ventas' },
    { icon: BookOpen, label: 'Wiki EPA', path: '/wiki-epa' },
    { icon: Radio, label: 'Sensores IoT', path: '/sensores-iot' },
    { icon: BarChart3, label: 'Reportes', path: '/reportes' },
    { icon: Bot, label: 'Consultas', path: '/agrobot' },
    { icon: Bell, label: 'Alertas', path: '/alertas' },
    { icon: History, label: 'Historial', path: '/historial' },
];

const main2Items: MenuItem[] = [
    { icon: Bell, label: 'Notificaciones', path: '/notificaciones' },
    { icon: User, label: 'Perfil', path: '/perfil' },
    { icon: Settings, label: 'Configuración', path: '/configuracion' },
];

const linkBase = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors";
const linkActive = "bg-emerald-50 text-emerald-700";
const linkIdle = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleCerrarSesion() {
    cerrarSesion();
    onClose();
    navigate('/login');
  }

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex-col z-30">
        <div className="p-4 flex items-center justify-between border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
              <img src={logoAgrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">AgroSoft</h1>
              <span className="text-xs text-gray-500 uppercase tracking-wider">SENA</span>
            </div>
          </div>
        </div>
        <SidebarContent />
      </aside>

      <aside className="hidden md:flex lg:hidden w-20 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex-col items-center py-4 z-30">
        <div className="w-10 h-10 rounded-lg overflow-hidden mb-6 shrink-0">
          <img src={logoAgrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
        </div>

        <nav className="flex flex-col items-center gap-2 w-full px-2 flex-1 min-h-0 overflow-y-auto">
          {mainItems.map((item) => {
            const target = item.children ? item.children[0].path : item.path;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.label}
                to={target}
                title={item.label}
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2 w-full px-2 pt-2 mt-2 border-t border-gray-200 shrink-0">
          {main2Items.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                title={item.label}
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleCerrarSesion}
            title="Cerrar sesión"
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

          <aside className="fixed left-0 top-0 h-screen w-64 bg-white z-50 shadow-2xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                  <img src={logoAgrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-lg leading-tight">AgroSoft</h1>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">SENA</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </>
      )}
    </>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState<string | null>(() => {
    const actual = mainItems.find(
      (i) => i.children && location.pathname.startsWith(i.path)
    );
    return actual ? actual.label : null;
  });

  useEffect(() => {
    const actual = mainItems.find(
      (i) => i.children && location.pathname.startsWith(i.path)
    );
    if (actual) {
      setAbierto(actual.label);
    }
  }, [location.pathname]);

  function handleCerrarSesion() {
    cerrarSesion();
    onNavigate?.();
    navigate('/login');
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
        {mainItems.map((item) => {
          if (item.children) {
            const estaAbierto = abierto === item.label;
            const grupoActivo = location.pathname.startsWith(item.path);
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setAbierto(estaAbierto ? null : item.label)}
                  className={`${linkBase} w-full justify-between cursor-pointer ${grupoActivo ? linkActive : linkIdle}`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${estaAbierto ? 'rotate-180' : ''}`}
                  />
                </button>

                {estaAbierto && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-100 space-y-1">
                    {item.children.map((sub) => {
                      const subActivo = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={onNavigate}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${subActivo ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={onNavigate}
              className={`${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 px-3 pt-4 pb-4 border-t border-gray-100 space-y-1">
        {main2Items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={onNavigate}
              className={`${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleCerrarSesion}
            className={`${linkBase} w-full text-red-600 hover:bg-red-50 cursor-pointer`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}