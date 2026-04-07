import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, type User } from '../store/authStore';
import {
    LogOut,
    LayoutDashboard,
    Palette,
    Activity,
    Settings,
    Zap,
    Store,
    Users,
    Menu,
    X,
    ChevronsLeft,
    ChevronsRight,
    type LucideIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

type NavItem = {
    name: string;
    path: string;
    icon: LucideIcon;
};

type SidebarContentProps = {
    navItems: NavItem[];
    pathname: string;
    user: User | null;
    displayName: string;
    initials: string;
    collapsed?: boolean;
    showDesktopToggle?: boolean;
    onNavigate: () => void;
    onLogout: () => void;
    onToggleCollapsed?: () => void;
};

function SidebarContent({
    navItems,
    pathname,
    user,
    displayName,
    initials,
    collapsed = false,
    showDesktopToggle = false,
    onNavigate,
    onLogout,
    onToggleCollapsed,
}: SidebarContentProps) {
    return (
        <div className="flex flex-col h-full">
            <div className={cn('px-3 py-4 flex items-center', collapsed ? 'flex-col gap-3' : 'gap-3')}>
                <Link
                    to="/projects"
                    className={cn(
                        'group rounded-lg transition-colors',
                        collapsed ? 'flex items-center justify-center' : 'flex flex-1 items-center space-x-3 min-w-0',
                    )}
                    onClick={onNavigate}
                    aria-label="科研配图生成器"
                    title="科研配图生成器"
                >
                    <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg flex-shrink-0" />
                    {!collapsed ? (
                        <span className="font-semibold text-sm text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                            科研配图生成器
                        </span>
                    ) : null}
                </Link>

                {showDesktopToggle ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapsed}
                        aria-label={collapsed ? '展开导航栏' : '收起导航栏'}
                        title={collapsed ? '展开导航栏' : '收起导航栏'}
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/70"
                    >
                        {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                    </Button>
                ) : null}
            </div>

            <div className="mx-3 mb-2 h-px bg-border/60" />

            <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            aria-label={item.name}
                            title={item.name}
                            className={cn(
                                'group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                                collapsed ? 'justify-center px-2 py-2.5' : 'space-x-3 px-3 py-2.5',
                                isActive
                                    ? 'bg-background text-foreground shadow-sm border border-border/50'
                                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                            )}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
                            )}
                            <item.icon
                                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                }`}
                            />
                            {!collapsed ? <span>{item.name}</span> : null}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto">
                <div className="mx-3 mb-3 h-px bg-border/60" />
                <div className="px-3 pb-4 space-y-1">
                    <div className={cn('px-2 py-2 rounded-lg', collapsed ? 'flex justify-center' : 'flex items-center space-x-3')}>
                        {user?.linuxdo_avatar_url ? (
                            <img
                                src={user.linuxdo_avatar_url}
                                alt="avatar"
                                className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary leading-none">
                                    {initials}
                                </span>
                            </div>
                        )}
                        {!collapsed ? (
                            <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                                {displayName}
                            </span>
                        ) : null}
                    </div>
                    <Button
                        variant="ghost"
                        size={collapsed ? 'icon' : 'sm'}
                        onClick={onLogout}
                        aria-label="退出登录"
                        title="退出登录"
                        className={cn(
                            'text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-sm font-medium',
                            collapsed ? 'w-full justify-center px-0' : 'w-full justify-start px-2',
                        )}
                    >
                        <LogOut className={cn('w-4 h-4 flex-shrink-0', collapsed ? '' : 'mr-3')} />
                        {!collapsed ? '退出登录' : null}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function Layout() {
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Studio 项目', path: '/projects', icon: LayoutDashboard },
        { name: '配图市场', path: '/market', icon: Store },
        { name: '配色管理', path: '/color-schemes', icon: Palette },
        { name: '用量看板', path: '/usage', icon: Activity },
        { name: '设置', path: '/settings', icon: Settings },
        { name: 'Quick Lab', path: '/generate', icon: Zap },
        ...(user?.is_admin ? [
            { name: '市场管理', path: '/admin/market', icon: Store },
            { name: '用户管理', path: '/admin/users', icon: Users },
        ] : []),
    ];

    const displayName = user?.linuxdo_username || user?.display_name || user?.email || '';
    const initials = displayName
        ? displayName.slice(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="min-h-screen flex bg-muted/30">
            <aside
                data-sidebar-kind="desktop"
                data-collapsed={desktopSidebarCollapsed ? 'true' : 'false'}
                className={cn(
                    'hidden md:flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-20 bg-muted/50 border-r border-border/60 transition-[width] duration-200',
                    desktopSidebarCollapsed ? 'w-20' : 'w-[260px]',
                )}
            >
                <SidebarContent
                    navItems={navItems}
                    pathname={location.pathname}
                    user={user}
                    displayName={displayName}
                    initials={initials}
                    collapsed={desktopSidebarCollapsed}
                    showDesktopToggle
                    onNavigate={() => {}}
                    onLogout={handleLogout}
                    onToggleCollapsed={() => setDesktopSidebarCollapsed((currentValue) => !currentValue)}
                />
            </aside>

            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed inset-y-0 left-0 z-40 w-[260px] flex flex-col
                    bg-muted/95 backdrop-blur border-r border-border/60
                    transform transition-transform duration-200 ease-in-out
                    md:hidden
                    ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <button
                    className="absolute top-4 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Close sidebar"
                >
                    <X className="w-4 h-4" />
                </button>
                <SidebarContent
                    navItems={navItems}
                    pathname={location.pathname}
                    user={user}
                    displayName={displayName}
                    initials={initials}
                    onNavigate={() => setMobileSidebarOpen(false)}
                    onLogout={handleLogout}
                />
            </aside>

            <div
                className={cn(
                    'flex-1 flex flex-col min-w-0 transition-[margin] duration-200',
                    desktopSidebarCollapsed ? 'md:ml-20' : 'md:ml-[260px]',
                )}
            >
                <div className="md:hidden flex items-center px-4 h-14 border-b border-border/60 bg-background sticky top-0 z-10">
                    <button
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-3"
                        onClick={() => setMobileSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <Link to="/projects" className="flex items-center space-x-2">
                        <img src="/logo.jpg" alt="Logo" className="w-6 h-6 rounded" />
                        <span className="font-semibold text-sm text-foreground">科研配图生成器</span>
                    </Link>
                </div>

                <main className="flex-1 px-6 py-8 md:px-8 bg-background min-h-screen">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
