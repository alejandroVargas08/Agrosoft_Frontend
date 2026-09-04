import { Home, Sprout, Map, ClipboardList, AlertTriangle, FlaskConical, 
  Wheat, Package, ShoppingCart, BookOpen, Radio, BarChart3, 
  Bell, History, User, Settings, ChevronDown } from "lucide-react";

interface MenuItem{
    icon: React.ElementType;
    label: string;
    active?: boolean;
}

const mainItems: MenuItem[]=[
    {icon: Home, label: 'Inicio', active: true},
    {icon: Sprout, label: 'Unidades Productivas' },
    {icon: Map, label: 'Lotes y Sublotes'},
    {icon: ClipboardList, label: 'Actividades'},
    {icon: AlertTriangle, label: 'Incidencias'},
    {icon: FlaskConical, label: 'Tratamientos'},
    {icon: Wheat, label: 'Cosecha'},
    {icon: Package, label: 'Inventario'},
    {icon: ShoppingCart, label: 'Ventas'},
    {icon: BookOpen, label: 'Wiki EPA'},
    {icon: Radio, label: 'Sensores IoT'},
    {icon: BarChart3, label: 'Reportes'},
    {icon: Bell, label: 'Alertas'},
    {icon: History, label: 'Historial'}
];

const main2Items: MenuItem[]=[
    { icon: Bell, label: 'Notificaciones' },
    { icon: User, label: 'Perfil' },
    { icon: Settings, label: 'Configuración' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
          <Sprout className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-tight">AgroSoft</h1>
          <span className="text-xs text-gray-500 uppercase tracking-wider">SENA</span>
        </div>
      </div>

      {/* Menú principal */}
      <nav className="flex-1 px-3 space-y-1">
        {mainItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              item.active
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </a>
        ))}

        <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
          {main2Items.map((item) => (
            <a
              key={item.label}
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </aside>
  );
}