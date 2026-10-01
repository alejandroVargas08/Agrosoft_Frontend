// Componentes compartidos del diseño AgroSoft (Figma Make).
// Se usan en todas las pantallas para que se vean igual al diseño.
import type { ElementType, ReactNode } from 'react';
import { ChevronLeft, Search, X, Leaf } from 'lucide-react';

// ─── Badge ──────────────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const BADGE_COLORS: Record<BadgeColor, string> = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-amber-100 text-amber-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    muted: 'bg-muted text-muted-foreground',
};

export const Badge = ({ children, color = 'primary' }: { children: ReactNode; color?: BadgeColor }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${BADGE_COLORS[color]}`}>
        {children}
    </span>
);

// ─── StatusBadge: traduce un estado a color + texto ──────────────────────────
const STATUS_MAP: Record<string, [BadgeColor, string]> = {
    // Estados del backend (español)
    activo: ['success', 'Activo'],
    inactivo: ['muted', 'Inactivo'],
    en_preparacion: ['warning', 'En preparación'],
    finalizado: ['info', 'Finalizado'],
    cancelado: ['danger', 'Cancelado'],
    // Estados del diseño
    active: ['success', 'Activo'], inactive: ['muted', 'Inactivo'],
    open: ['danger', 'Abierta'], in_treatment: ['warning', 'En tratamiento'],
    resolved: ['success', 'Resuelta'],
    pending: ['warning', 'Pendiente'], in_progress: ['info', 'En progreso'],
    completed: ['success', 'Completada'], scheduled: ['info', 'Programado'],
    applied: ['warning', 'Aplicado'],
    paid: ['success', 'Pagada'], cancelled: ['danger', 'Anulada'],
    online: ['success', 'En línea'], offline: ['danger', 'Desconectado'],
    upcoming: ['info', 'Próximo'],
    A: ['success', 'Calidad A'], B: ['warning', 'Calidad B'], C: ['danger', 'Calidad C'],
    low: ['info', 'Baja'], medium: ['warning', 'Media'], high: ['danger', 'Alta'],
    plot: ['primary', 'Lote'], subplot: ['info', 'Sublote'],
};

export const StatusBadge = ({ status }: { status: string }) => {
    const [color, label] = STATUS_MAP[status] ?? ['muted', status];
    return <Badge color={color}>{label}</Badge>;
};

// ─── Botón ──────────────────────────────────────────────────────────────────
interface BtnProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit';
}

const BTN_VARIANTS = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-white text-foreground hover:bg-muted',
    ghost: 'bg-transparent text-foreground hover:bg-muted',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
};

const BTN_SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

export const Btn = ({
    children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button',
}: BtnProps) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-lg font-semibold transition-all ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
        {children}
    </button>
);

// ─── Card ───────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`bg-card rounded-xl border border-border shadow-sm p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    >
        {children}
    </div>
);

// ─── StatCard (tarjeta de resumen con ícono) ───────────────────────────────────
const STAT_COLORS = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
};

interface StatCardProps {
    icon: ElementType;
    label: string;
    value: ReactNode;
    sub?: string;
    color?: keyof typeof STAT_COLORS;
}

export const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }: StatCardProps) => (
    <Card className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${STAT_COLORS[color]}`}><Icon size={20} /></div>
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
    </Card>
);

// ─── Modal ──────────────────────────────────────────────────────────────────
interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export const Modal = ({ open, onClose, title, children }: ModalProps) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X size={18} /></button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
};

// ─── EmptyState (cuando no hay datos) ─────────────────────────────────────────
interface EmptyStateProps {
    icon?: ElementType;
    title: string;
    description: string;
    action?: ReactNode;
}

export const EmptyState = ({ icon: Icon = Leaf, title, description, action }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-muted rounded-2xl mb-4"><Icon size={32} className="text-muted-foreground" /></div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
        {action}
    </div>
);

// ─── PageHeader (título de cada pantalla) ────────────────────────────────────
interface PageHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    action?: ReactNode;
}

export const PageHeader = ({ title, subtitle, onBack, action }: PageHeaderProps) => (
    <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
            {onBack && (
                <button onClick={onBack} className="mt-0.5 p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                    <ChevronLeft size={20} />
                </button>
            )}
            <div>
                <h1 className="text-xl font-bold text-foreground">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
        </div>
        {action}
    </div>
);

// ─── SearchBar ──────────────────────────────────────────────────────────────
interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = 'Buscar...' }: SearchBarProps) => (
    <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
        />
    </div>
);

// ─── Tab (pestañas) ─────────────────────────────────────────────────────────
interface TabProps {
    tabs: string[];
    active: string;
    onChange: (tab: string) => void;
}

export const Tab = ({ tabs, active, onChange }: TabProps) => (
    <div className="flex gap-1 bg-muted p-1 rounded-lg mb-4">
        {tabs.map((t) => (
            <button
                key={t}
                onClick={() => onChange(t)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${active === t ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
                {t}
            </button>
        ))}
    </div>
);

// ─── Campos de formulario ───────────────────────────────────────────────────
const FIELD_CLASS =
    'px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';

interface InputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    step?: string;
}

export const Input = ({
    label, value, onChange, type = 'text', placeholder = '', required = false, className = '', step,
}: InputProps) => (
    <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
            <label className="text-sm font-semibold text-foreground">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
        )}
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            step={step}
            className={FIELD_CLASS}
        />
    </div>
);

type SelectOption = string | { value: string; label: string };

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    className?: string;
}

export const Select = ({ label, value, onChange, options, className = '' }: SelectProps) => (
    <div className={`flex flex-col gap-1 ${className}`}>
        {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={FIELD_CLASS}>
            {options.map((o) => {
                const val = typeof o === 'string' ? o : o.value;
                const text = typeof o === 'string' ? o : o.label;
                return <option key={val} value={val}>{text}</option>;
            })}
        </select>
    </div>
);

interface TextareaProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    required?: boolean;
    className?: string;
}

export const Textarea = ({ label, value, onChange, placeholder = '', rows = 3, required = false, className = '' }: TextareaProps) => (
    <div className="flex flex-col gap-1">
        {label && (
            <label className="text-sm font-semibold text-foreground">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
        )}
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            required={required}
            className={`${FIELD_CLASS} resize-none ${className}`}
        />
    </div>
);