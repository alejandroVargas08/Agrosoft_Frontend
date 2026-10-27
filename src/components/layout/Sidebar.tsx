import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Map, ClipboardList, AlertTriangle, FlaskConical, Package, BookOpen, Radio, BarChart3, Bell, User, Settings, X, ChevronDown, LogOut, Bot, Leaf, Plane, GraduationCap, CheckSquare, ListTodo, MessageSquare, Inbox } from "lucide-react";
import logoAgrosoft from "../../assets/img/logo-agrosoft.png";
import { cerrarSesion } from "../../hooks/useAuth";
import { CerrarSesionModal } from "../ui/CerrarSesionModal";
import { usePermisos } from "../../hooks/permisos/usePermisos";

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

// ─── Menús por rol, igual que navItemsUser / Instructor / Admin del Figma ────
const PERMISO_ASIGNAR_ACTIVIDADES = 'actividades.asignar';
const PERMISO_EJECUTAR_ACTIVIDADES = 'actividades.ejecutar';

const itemsAprendiz: MenuItem[] = [
    { icon: Home, label: 'Inicio', path: '/inicio' },
    { icon: ListTodo, label: 'Mis Tareas', path: '/mis-tareas' },
    { icon: MessageSquare, label: 'Mis Novedades', path: '/mis-novedades' },
    { icon: Leaf, label: 'Cultivos', path: '/cultivos' },
    { icon: Map, label: 'Lotes y Sublotes', path: '/territorio' },
    { icon: ClipboardList, label: 'Actividades', path: '/actividades' },
    { icon: AlertTriangle, label: 'Incidencias', path: '/incidencias' },
    { icon: Package, label: 'Inventario', path: '/inventario' },
    { icon: BookOpen, label: 'Wiki EPA', path: '/wiki-epa' },
    { icon: Radio, label: 'Sensores IoT', path: '/sensores-iot' },
    { icon: Plane, label: 'Drones', path: '/drones' },
    { icon: Bot, label: 'Consultas / AgroBot', path: '/agrobot' },
    { icon: Bell, label: 'Alertas y Notificaciones', path: '/alertas' },
];

const itemsInstructor: MenuItem[] = [
    { icon: Home, label: 'Inicio', path: '/inicio' },
    { icon: GraduationCap, label: 'Mis Fichas', path: '/mis-fichas' },
    { icon: CheckSquare, label: 'Por revisar', path: '/por-revisar' },
    { icon: Inbox, label: 'Novedades', path: '/novedades' },
    { icon: ClipboardList, label: 'Actividades', path: '/actividades' },
    { icon: Leaf, label: 'Cultivos', path: '/cultivos' },
    { icon: Map, label: 'Lotes y Sublotes', path: '/territorio' },
    { icon: AlertTriangle, label: 'Incidencias', path: '/incidencias' },
    { icon: FlaskConical, label: 'Tratamientos', path: '/tratamientos' },
    { icon: Package, label: 'Inventario', path: '/inventario' },
    { icon: Plane, label: 'Drones', path: '/drones' },
    { icon: Radio, label: 'Sensores IoT', path: '/sensores-iot' },
    { icon: BookOpen, label: 'Wiki EPA', path: '/wiki-epa' },
    { icon: BarChart3, label: 'Reportes', path: '/reportes' },
    { icon: Bot, label: 'Consultas', path: '/agrobot' },
];


const main2Items: MenuItem[] = [
    { icon: Bell, label: 'Notificaciones', path: '/notificaciones' },
    { icon: User, label: 'Perfil', path: '/perfil' },
    { icon: Settings, label: 'Configuración', path: '/configuracion' },
];

const linkBase = "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors";
const linkActive = "bg-sidebar-accent text-sidebar-primary";
const linkIdle = "text-sidebar-foreground hover:bg-sidebar-accent/50";

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [modalCerrarSesion, setModalCerrarSesion] = useState(false);
  const { puede } = usePermisos();

  // El menú depende del rol, como en el Figma. El admin manda sobre el resto.
  // El administrador no pasa por aqui: DashboardLayout le da SidebarAdmin
  const itemsPrincipales = puede(PERMISO_ASIGNAR_ACTIVIDADES)
      ? itemsInstructor
      : puede(PERMISO_EJECUTAR_ACTIVIDADES)
        ? itemsAprendiz
        : itemsAprendiz.filter((i) => i.path !== '/mis-tareas' && i.path !== '/mis-novedades');

  async function confirmarCerrarSesion() {
    await cerrarSesion();
    setModalCerrarSesion(false);
    onClose();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-sidebar h-screen fixed left-0 top-0 border-r border-sidebar-border flex-col z-30">
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
              <img src={logoAgrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground text-lg leading-tight">AgroSoft</h1>
              <span className="text-xs text-gray-500 uppercase tracking-wider">SENA</span>
            </div>
          </div>
        </div>
        <SidebarContent items={itemsPrincipales} onCerrarSesion={() => setModalCerrarSesion(true)} />
      </aside>

      <aside className="hidden md:flex lg:hidden w-20 bg-sidebar h-screen fixed left-0 top-0 border-r border-sidebar-border flex-col items-center py-4 z-30">
        <div className="w-10 h-10 rounded-lg overflow-hidden mb-6 shrink-0">
          <img src={logoAgrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
        </div>

        <nav className="flex flex-col items-center gap-2 w-full px-2 flex-1 min-h-0 overflow-y-auto">
          {itemsPrincipales.map((item) => {
            const target = item.children ? item.children[0].path : item.path;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.label}
                to={target}
                title={item.label}
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2 w-full px-2 pt-2 mt-2 border-t border-sidebar-border shrink-0">
          {main2Items.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                title={item.label}
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setModalCerrarSesion(true)}
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

          <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar z-50 shadow-2xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-sidebar-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                  <img src={logoAgrosoft} alt="AgroSoft" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="font-bold text-sidebar-foreground text-lg leading-tight">AgroSoft</h1>
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
            <SidebarContent
              items={itemsPrincipales}
              onNavigate={onClose}
              onCerrarSesion={() => setModalCerrarSesion(true)}
            />
          </aside>
        </>
      )}

      <CerrarSesionModal
        abierto={modalCerrarSesion}
        onCancelar={() => setModalCerrarSesion(false)}
        onConfirmar={confirmarCerrarSesion}
      />
    </>
  );
}

function SidebarContent({
  items,
  onNavigate,
  onCerrarSesion,
}: {
  items: MenuItem[];
  onNavigate?: () => void;
  onCerrarSesion: () => void;
}) {
  const location = useLocation();

  // El grupo que corresponde a la ruta actual, calculado en el render
  const grupoDeLaRuta =
    items.find((i) => i.children && location.pathname.startsWith(i.path))?.label ?? null;

  const [abierto, setAbierto] = useState<string | null>(grupoDeLaRuta);
  const [rutaVista, setRutaVista] = useState(location.pathname);

  // Al cambiar de ruta se abre el grupo que la contiene. Se ajusta en el
  // render, no en un efecto: así no hay un segundo pase de renderizado.
  if (rutaVista !== location.pathname) {
    setRutaVista(location.pathname);
    if (grupoDeLaRuta) setAbierto(grupoDeLaRuta);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <nav className="flex-1 min-h-0 overflow-y-auto py-2">
        {items.map((item) => {
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
                  <div className="ml-9 border-l border-sidebar-border">
                    {item.children.map((sub) => {
                      const subActivo = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={onNavigate}
                          className={`block px-4 py-2 text-sm transition-colors ${subActivo ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
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

      <div className="shrink-0 py-2 border-t border-sidebar-border">
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

        <div className="pt-2 mt-2 border-t border-sidebar-border">
          <button
            type="button"
            onClick={onCerrarSesion}
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
