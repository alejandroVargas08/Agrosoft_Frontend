import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, Sprout, Map, AlertTriangle, FlaskConical,
  Wheat, Package, ShoppingCart, BookOpen, Radio, BarChart3,
  Bell, History, Settings, X, ChevronDown 
} from "lucide-react";
import logoAgrosoft from "../../assets/img/logo-agrosoft.png";

interface SubItem {
  icon: React.ElementType;
  label: string;
  path?: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  path?: string;
  children?: SubItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainItems: MenuItem[] = [
  { icon: Home, label: 'Inicio', path: '/inicio' },
  { icon: Sprout, label: 'Unidades Productivas', path: '/unidades-productivas' },
  { 
    icon: Map, 
    label: 'Lotes y Sublotes', 
    path: '/territorio'},

  {icon: Wheat, label: 'Actividades', path: '/Actividades'},
  { icon: AlertTriangle,
    label: 'Gestión de Lotes',
    path: '/terrirotio-hijos',
    children: [
      { icon: AlertTriangle, label: 'Incidencias', path: '/territorio/incidencias' },
      { icon: FlaskConical, label: 'Tratamientos', path: '/territorio/tratamientos' },
      { icon: Wheat, label: 'Cosecha', path: '/territorio/cosecha' },
      { icon: Package, label: 'Inventario', path: '/territorio/inventario' },
      { icon: ShoppingCart, label: 'Ventas', path: '/territorio/ventas' },
      { icon: BookOpen, label: 'Wiki EPA', path: '/territorio/wiki' },
      { icon: Radio, label: 'Sensores IoT', path: '/territorio/sensores' },
      { icon: BarChart3, label: 'Reportes', path: '/territorio/reportes' },
      { icon: Bell, label: 'Alertas', path: '/territorio/alertas' },
      { icon: History, label: 'Historial', path: '/territorio/historial' }
    ]
  }
];

const main2Items: MenuItem[] = [
  { icon: Bell, label: 'Notificaciones', path: '/notificaciones' },
  { icon: Settings, label: 'Configuración', path: '/configuracion' },
];

const linkBase = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors";
const linkActive = "bg-emerald-50 text-emerald-700";
const linkIdle = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Sidebar para pantallas grandes (Desktop) */}
      <aside className="hidden lg:flex w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex-col overflow-y-auto z-30">
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
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

      {/* Sidebar colapsado para pantallas medianas (Tablet) */}
      <aside className="hidden md:flex lg:hidden w-20 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex-col items-center py-6 overflow-y-auto z-30">
        <div className="w-10 h-10 rounded-lg overflow-hidden mb-8 flex-shrink-0">
          <img src={logoAgrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
        </div>
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {mainItems.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            return (
              <Link 
                key={item.label}
                to={item.path || "#"} 
                title={item.label} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Menú móvil desplegable */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
          <aside className="fixed left-0 top-0 h-screen w-64 bg-white z-50 shadow-xl md:hidden flex flex-col overflow-y-auto">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={logoAgrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-lg leading-tight">AgroSoft</h1>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">SENA</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 px-3 py-4">
              <SidebarContent onNavigate={onClose} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const [abierto, setAbierto] = useState<string | null>(() => {
    const actual = mainItems.find(
      (i) => i.children && i.path && location.pathname.startsWith(i.path)
    );
    return actual ? actual.label : null;
  });

  return (
    <nav className="px-3 py-6 space-y-1">
      {mainItems.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isAbierto = abierto === item.label;
        const isActive = item.path ? location.pathname === item.path : false;

        if (hasChildren) {
          return (
            <div key={item.label} className="space-y-1">
              <button
                onClick={() => setAbierto(isAbierto ? null : item.label)}
                className={`w-full ${linkBase} ${isActive ? linkActive : linkIdle} justify-between`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isAbierto ? 'rotate-180' : ''}`} />
              </button>

              {isAbierto && (
                <div className="mt-1 ml-4 pl-4 border-l border-gray-100 space-y-1">
                  {item.children!.map((sub) => {
                    const subActivo = sub.path ? location.pathname === sub.path : false;
                    return (
                      <Link
                        key={sub.label}
                        to={sub.path || '#'}
                        onClick={onNavigate}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          subActivo ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
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

        return (
          <Link
            key={item.label}
            to={item.path || '#'}
            onClick={onNavigate}
            className={`${linkBase} ${isActive ? linkActive : linkIdle}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
        {main2Items.map((item) => {
          const isActive = item.path ? location.pathname === item.path : false;
          return (
            <Link
              key={item.label}
              to={item.path || '#'}
              onClick={onNavigate}
              className={`${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}