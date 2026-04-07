import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, vi } from 'vitest';

import { render, screen } from '@/test/render';
import { SettingsHub } from '@/pages/SettingsHub';

const mockUseAuthStore = vi.fn();

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector?: (state: unknown) => unknown) => mockUseAuthStore(selector),
}));

vi.mock('@/pages/Settings', () => ({
  Settings: () => <div>个人设置内容</div>,
}));

vi.mock('@/pages/AdminSettings', () => ({
  AdminSettings: () => <div>系统管理内容</div>,
}));

describe('SettingsHub', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          display_name: '管理员',
          is_admin: true,
        },
      };

      return typeof selector === 'function' ? selector(state) : state;
    });
  });

  it('shows top navigation tabs for personal and admin settings', async () => {
    render(
      <MemoryRouter initialEntries={['/settings/admin']}>
        <Routes>
          <Route path="/settings/*" element={<SettingsHub />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('tab', { name: /个人设置/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /系统管理/ })).toBeInTheDocument();
    expect(screen.getByText('系统管理内容')).toBeInTheDocument();
  });

  it('redirects non-admin users back to personal settings', async () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          display_name: '普通用户',
          is_admin: false,
        },
      };

      return typeof selector === 'function' ? selector(state) : state;
    });

    render(
      <MemoryRouter initialEntries={['/settings/admin']}>
        <Routes>
          <Route path="/settings/*" element={<SettingsHub />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('tab', { name: /个人设置/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /系统管理/ })).not.toBeInTheDocument();
    expect(screen.getByText('个人设置内容')).toBeInTheDocument();
  });
});
