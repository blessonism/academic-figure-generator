import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

import { render, screen } from '@/test/render';

const mockUseAuthStore = vi.fn();
const apiGet = vi.fn();

vi.mock('./store/authStore', () => ({
  useAuthStore: (selector: (state: {
    token: string | null;
    refreshToken: string | null;
    user: {
      id: number;
      email: string;
      display_name: string;
      is_admin?: boolean;
      prompt_ai_available?: boolean;
    } | null;
    setAuth: (token: string, refreshToken: string, user: unknown) => void;
    logout: () => void;
  }) => unknown) => mockUseAuthStore(selector),
}));

vi.mock('./lib/api', () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
  },
}));

vi.mock('./pages/Login', () => ({
  Login: () => <div>登录页</div>,
}));

vi.mock('./pages/LinuxDOCallback', () => ({
  LinuxDOCallback: () => <div>LinuxDO 回调页</div>,
}));

vi.mock('./pages/Projects', () => ({
  Projects: () => <div>项目页</div>,
}));

vi.mock('./pages/ProjectStudioPage', () => ({
  ProjectStudioPage: () => <div>项目工作台页</div>,
}));

vi.mock('./pages/StudioDemoPage', () => ({
  StudioDemoPage: () => <div>Studio Demo 页</div>,
}));

vi.mock('./pages/StudioDemoV2Page', () => ({
  StudioDemoV2Page: () => <div>Studio Demo V2 页</div>,
}));

vi.mock('./pages/ColorSchemes', () => ({
  ColorSchemes: () => <div>配色页</div>,
}));

vi.mock('./pages/Usage', () => ({
  Usage: () => <div>用量页</div>,
}));

vi.mock('./pages/SettingsHub', () => ({
  SettingsHub: () => <div>设置页</div>,
}));

vi.mock('./pages/Generate', () => ({
  Generate: () => <div>Quick Lab 页</div>,
}));

vi.mock('./pages/Market', () => ({
  Market: () => <div>市场首页</div>,
}));

vi.mock('./pages/MarketItemDetail', () => ({
  MarketItemDetail: () => <div>市场详情页</div>,
}));

vi.mock('./pages/MarketMine', () => ({
  MarketMine: () => <div>我的市场页</div>,
}));

vi.mock('./pages/AdminMarket', () => ({
  AdminMarket: () => <div>市场管理页</div>,
}));

vi.mock('./pages/AdminUsers', () => ({
  AdminUsers: () => <div>用户管理页</div>,
}));

describe('App 市场路由权限', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    apiGet.mockReset();
    apiGet.mockResolvedValue({
      data: {
        id: 1,
        email: 'user@example.com',
        display_name: '测试用户',
        prompt_ai_available: true,
      },
    });
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        token: null,
        refreshToken: null,
        user: null,
        setAuth: vi.fn(),
        logout: vi.fn(),
      }),
    );
  });

  it('未登录访问市场首页时跳转到登录页', async () => {
    window.history.replaceState({}, '', '/market');
    const { default: App } = await import('./App');

    render(<App />);

    expect(await screen.findByText('登录页')).toBeInTheDocument();
  });

  it('已登录访问市场首页时显示左侧导航栏', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        token: 'token',
        refreshToken: 'refresh-token',
        user: {
          id: 1,
          email: 'user@example.com',
          display_name: '测试用户',
        },
        setAuth: vi.fn(),
        logout: vi.fn(),
      }),
    );
    window.history.replaceState({}, '', '/market');
    const { default: App } = await import('./App');

    render(<App />);

    expect(await screen.findByText('市场首页')).toBeInTheDocument();
    expect(screen.getAllByText('Studio 项目').length).toBeGreaterThan(0);
    expect(screen.getAllByText('配图市场').length).toBeGreaterThan(0);
  });

  it('未登录访问市场详情时跳转到登录页', async () => {
    window.history.replaceState({}, '', '/market/items/item-1');
    const { default: App } = await import('./App');

    render(<App />);

    expect(await screen.findByText('登录页')).toBeInTheDocument();
  });

  it('已有登录态时会刷新当前用户资料', async () => {
    const setAuth = vi.fn();
    apiGet.mockResolvedValue({
      data: {
        id: 1,
        email: 'user@example.com',
        display_name: '测试用户',
        prompt_ai_available: true,
      },
    });
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        token: 'token',
        refreshToken: 'refresh-token',
        user: {
          id: 1,
          email: 'user@example.com',
          display_name: '测试用户',
          prompt_ai_available: false,
        },
        setAuth,
        logout: vi.fn(),
      }),
    );

    const { default: App } = await import('./App');

    render(<App />);

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/auth/me');
    });
    expect(setAuth).toHaveBeenCalledWith(
      'token',
      'refresh-token',
      expect.objectContaining({ prompt_ai_available: true }),
    );
  });
});
