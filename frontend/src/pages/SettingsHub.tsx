import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Settings2, Shield } from 'lucide-react';

import { Settings } from './Settings';
import { AdminSettings } from './AdminSettings';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

type SettingsTab = {
    label: string;
    description: string;
    to: string;
    icon: typeof Settings2;
};

export function SettingsHub() {
    const user = useAuthStore((state) => state.user);
    const location = useLocation();
    const isAdmin = Boolean(user?.is_admin);
    const tabs: SettingsTab[] = [
        {
            label: '个人设置',
            description: '账户资料、登录安全与默认偏好',
            to: '/settings',
            icon: Settings2,
        },
        ...(isAdmin ? [{
            label: '系统管理',
            description: '平台能力、接入与计费配置',
            to: '/settings/admin',
            icon: Shield,
        }] : []),
    ];

    if (!isAdmin && location.pathname.startsWith('/settings/admin')) {
        return <Navigate to="/settings" replace />;
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">设置</h1>
                <p className="mt-1 text-muted-foreground">统一管理个人偏好与平台配置。管理员可在同一入口下切换到系统管理分区。</p>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-2">
                <div className="grid gap-2 md:grid-cols-2" role="tablist" aria-label="设置分区">
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.to || (tab.to === '/settings' && location.pathname === '/settings/');
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.to}
                                to={tab.to}
                                role="tab"
                                aria-selected={isActive}
                                className={cn(
                                    'rounded-xl border px-4 py-3 transition-colors',
                                    isActive
                                        ? 'border-primary/30 bg-background text-foreground shadow-sm'
                                        : 'border-transparent text-muted-foreground hover:border-border hover:bg-background/70 hover:text-foreground',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn('rounded-lg p-2', isActive ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground')}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">{tab.label}</p>
                                        <p className="text-xs leading-5 text-muted-foreground">{tab.description}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <Routes>
                <Route index element={<Settings embedded />} />
                <Route path="admin" element={isAdmin ? <AdminSettings embedded /> : <Navigate to="/settings" replace />} />
            </Routes>
        </div>
    );
}
