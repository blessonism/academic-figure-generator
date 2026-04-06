import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { Layout } from './components/Layout';

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
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));
const Generate = lazy(() => import('./pages/Generate').then((module) => ({ default: module.Generate })));
const AdminSettings = lazy(() =>
  import('./pages/AdminSettings').then((module) => ({ default: module.AdminSettings }))
);
const AdminUsers = lazy(() =>
  import('./pages/AdminUsers').then((module) => ({ default: module.AdminUsers }))
);

function RouteFallback() {
  return <div className="p-6 text-sm text-slate-500">页面加载中...</div>;
}

function App() {
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
              <Route path="/color-schemes" element={<ColorSchemes />} />
              <Route path="/usage" element={<Usage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/generate" element={<Generate />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
