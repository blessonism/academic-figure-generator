import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { Layout } from './components/Layout';
import { api } from './lib/api';
import { useAuthStore } from './store/authStore';

const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const LinuxDOCallback = lazy(() =>
  import('./pages/LinuxDOCallback').then((module) => ({ default: module.LinuxDOCallback }))
);
const Projects = lazy(() => import('./pages/Projects').then((module) => ({ default: module.Projects })));
const ProjectStudioPage = lazy(() =>
  import('./pages/ProjectStudioPage').then((module) => ({ default: module.ProjectStudioPage }))
);
const StudioDemoPage = lazy(() =>
  import('./pages/StudioDemoPage').then((module) => ({ default: module.StudioDemoPage }))
);
const StudioDemoV2Page = lazy(() =>
  import('./pages/StudioDemoV2Page').then((module) => ({ default: module.StudioDemoV2Page }))
);
const ColorSchemes = lazy(() =>
  import('./pages/ColorSchemes').then((module) => ({ default: module.ColorSchemes }))
);
const Usage = lazy(() => import('./pages/Usage').then((module) => ({ default: module.Usage })));
const SettingsHub = lazy(() => import('./pages/SettingsHub').then((module) => ({ default: module.SettingsHub })));
const Generate = lazy(() => import('./pages/Generate').then((module) => ({ default: module.Generate })));
const Market = lazy(() => import('./pages/Market').then((module) => ({ default: module.Market })));
const MarketItemDetail = lazy(() =>
  import('./pages/MarketItemDetail').then((module) => ({ default: module.MarketItemDetail }))
);
const MarketMine = lazy(() => import('./pages/MarketMine').then((module) => ({ default: module.MarketMine })));
const AdminMarket = lazy(() =>
  import('./pages/AdminMarket').then((module) => ({ default: module.AdminMarket }))
);
const AdminUsers = lazy(() =>
  import('./pages/AdminUsers').then((module) => ({ default: module.AdminUsers }))
);

function RouteFallback() {
  return <div className="p-6 text-sm text-slate-500">页面加载中...</div>;
}

function App() {
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (!token || !refreshToken) {
      return;
    }

    let cancelled = false;

    void api.get('/auth/me')
      .then((response) => {
        if (cancelled) {
          return;
        }

        setAuth(token, refreshToken, response.data);
      })
      .catch(() => {
        // 交给统一拦截器与具体页面处理失败场景。
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken, setAuth, token]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/linuxdo/callback" element={<LinuxDOCallback />} />
          <Route path="/studio-demo" element={<StudioDemoPage />} />
          <Route path="/studio-demo-v2" element={<StudioDemoV2Page />} />

          {/* 业务页面按路由懒加载，避免首屏一次性打入全部管理与工作台代码。 */}
          <Route element={<AuthGuard />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectStudioPage />} />
              <Route path="/market" element={<Market />} />
              <Route path="/market/items/:id" element={<MarketItemDetail />} />
              <Route path="/market/mine" element={<MarketMine />} />
              <Route path="/color-schemes" element={<ColorSchemes />} />
              <Route path="/usage" element={<Usage />} />
              <Route path="/settings/*" element={<SettingsHub />} />
              <Route path="/generate" element={<Generate />} />
              <Route path="/admin/market" element={<AdminMarket />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
