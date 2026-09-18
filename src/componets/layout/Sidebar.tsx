import { Link, useLocation } from "react-router-dom";
import { Home, Sprout, Map, ClipboardList, AlertTriangle, FlaskConical, 
  Wheat, Package, ShoppingCart, BookOpen, Radio, BarChart3, 
  Bell, History, User, Settings, X} from "lucide-react";
import logoAgrosoft from "../../assets/img/logo-agrosoft.png"; 

interface MenuItem{
    icon: React.ElementType;
    label: string;
    path: string;
}
interface SidebarProps{
    isOpen: boolean;
    onClose: ()=> void;
}

const mainItems: MenuItem[]=[
    {icon: Home, label: 'Inicio', path: '/inicio'},
    {icon: Sprout, label: 'Unidades Productivas', path: '/unidades-productivas'},
    {icon: Map, label: 'Lotes y Sublotes', path: '/lotes'},
    {icon: ClipboardList, label: 'Actividades', path: '/actividades'},
    {icon: AlertTriangle, label: 'Incidencias', path: '/incidencias'},
    {icon: FlaskConical, label: 'Tratamientos', path: '/tratamientos'},
    {icon: Wheat, label: 'Cosecha', path: '/cosecha'},
    {icon: Package, label: 'Inventario', path: '/inventario'},
    {icon: ShoppingCart, label: 'Ventas', path: '/ventas'},
    {icon: BookOpen, label: 'Wiki EPA', path: '/wiki-epa'},
    {icon: Radio, label: 'Sensores IoT', path: '/sensores-iot'},
    {icon: BarChart3, label: 'Reportes', path: '/reportes'},
    {icon: Bell, label: 'Alertas', path: '/alertas'},
    {icon: History, label: 'Historial', path: '/historial'}
];

const main2Items: MenuItem[]=[
    { icon: Bell, label: 'Notificaciones', path: '/notificaciones' },
    { icon: User, label: 'Perfil', path: '/perfil' },
    { icon: Settings, label: 'Configuración', path: '/configuracion' },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
            const location = useLocation();
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                title={item.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
      </aside>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose}/>

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

  return (
    <nav className="px-3 py-6 space-y-1">
      {mainItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.label}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}

      <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
        {main2Items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}