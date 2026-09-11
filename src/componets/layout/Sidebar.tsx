import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Sprout, Map, ClipboardList, AlertTriangle, FlaskConical,
  Wheat, Package, ShoppingCart, BookOpen, Radio, BarChart3,
  Bell, History, User, Settings, X, ChevronDown } from "lucide-react";
import logoAgrosoft from "../../assets/img/logo-agrosoft.png";

interface SubItem {
  label: string;
  to: string;
}
interface MenuItem {
  icon: React.ElementType;
  label: string;
  to?: string;          // ruta directa
  children?: SubItem[]; // submenú desplegable
}
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainItems: MenuItem[] = [
  { icon: Home, label: 'Inicio', to: '/inicio' },
  { icon: Sprout, label: 'Unidades Productivas' },
  {
    icon: Map, label: 'Lotes y Sublotes',
    children: [
      { label: 'Lotes', to: '/territorio/lotes' },
      { label: 'Sublotes', to: '/territorio/sublotes' },
    ],
  },
  { icon: ClipboardList, label: 'Actividades' },
  { icon: AlertTriangle, label: 'Incidencias' },
  { icon: FlaskConical, label: 'Tratamientos' },
  { icon: Wheat, label: 'Cosecha' },
  {
    icon: Package, label: 'Inventario',
    children: [
      { label: 'Insumos', to: '/inventario/insumos' },
      { label: 'Catálogos', to: '/inventario/catalogos' },
      { label: 'Movimientos', to: '/inventario/movimientos' },
      { label: 'Reservas', to: '/inventario/reservas' },
    ],
  },
  { icon: ShoppingCart, label: 'Ventas' },
  { icon: BookOpen, label: 'Wiki EPA' },
  { icon: Radio, label: 'Sensores IoT' },
  { icon: BarChart3, label: 'Reportes' },
  { icon: Bell, label: 'Alertas' },
  { icon: History, label: 'Historial' },
];

const main2Items: MenuItem[] = [
  { icon: Bell, label: 'Notificaciones' },
  { icon: User, label: 'Perfil' },
  { icon: Settings, label: 'Configuración' },
];

const baseCls = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors';
const activeCls = 'bg-emerald-50 text-emerald-700';
const idleCls = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  // Para la barra compacta (tablet): un ítem está activo si su ruta o alguna de sus hijas coincide
  const estaActivo = (item: MenuItem) =>
    (item.to && location.pathname === item.to) ||
    item.children?.some((c) => location.pathname.startsWith(c.to));

  return (
    <>
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

      <aside className="hidden md:flex lg:hidden w-20 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex-col items-center py-6 overflow-y-auto z-30">
        <div className="w-10 h-10 rounded-lg overflow-hidden mb-8 flex-shrink-0">
          <img src={logoAgrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
        </div>
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {mainItems.slice(0, 8).map((item) => {
            const destino = item.to ?? item.children?.[0]?.to ?? '#';
            return (
              <NavLink
                key={item.label}
                to={destino}
                title={item.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  estaActivo(item) ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
              </NavLink>
            );
          })}
        </nav>
      </aside>

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

  // Submenús abiertos: por defecto el que contiene la ruta actual
  const [abiertos, setAbiertos] = useState<string[]>(() =>
    mainItems
      .filter((i) => i.children?.some((c) => location.pathname.startsWith(c.to)))
      .map((i) => i.label),
  );

  const toggle = (label: string) =>
    setAbiertos((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );

  return (
    <nav className="px-3 py-6 space-y-1">
      {mainItems.map((item) => {
        // Ítem con submenú
        if (item.children) {
          const abierto = abiertos.includes(item.label);
          const hijoActivo = item.children.some((c) => location.pathname.startsWith(c.to));
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggle(item.label)}
                className={`${baseCls} w-full ${hijoActivo ? activeCls : idleCls}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
              </button>
              {abierto && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-lg text-sm ${isActive ? activeCls : idleCls}`
                      }
                    >
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Ítem con ruta directa
        if (item.to) {
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) => `${baseCls} ${isActive ? activeCls : idleCls}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        }

        // Ítem sin ruta todavía (lo hará el equipo)
        return (
          <a key={item.label} href="#" className={`${baseCls} ${idleCls}`}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </a>
        );
      })}

      <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
        {main2Items.map((item) => (
          <a key={item.label} href="#" className={`${baseCls} ${idleCls}`}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}