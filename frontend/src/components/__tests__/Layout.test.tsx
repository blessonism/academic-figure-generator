import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { render, screen } from '@/test/render';
import { Layout } from '@/components/Layout';

const mockUseAuthStore = vi.fn();

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: object | null; logout: () => void }) => unknown) =>
    mockUseAuthStore(selector),
}));

describe('Layout', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        user: {
          id: 1,
          email: 'test@example.com',
          display_name: '测试用户',
        },
        logout: vi.fn(),
      }),
    );
  });

  it('shows studio and quick lab navigation labels', () => {
    render(
      <MemoryRouter initialEntries={['/generate']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/generate" element={<div>Quick Lab Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Studio 项目').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Quick Lab').length).toBeGreaterThan(0);
  });

  it('toggles desktop sidebar collapsed state', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter initialEntries={['/generate']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/generate" element={<div>Quick Lab Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const desktopSidebar = container.querySelector('aside[data-sidebar-kind="desktop"]');

    expect(desktopSidebar).toHaveAttribute('data-collapsed', 'false');
    expect(screen.getByRole('button', { name: '收起导航栏' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '收起导航栏' }));

    expect(desktopSidebar).toHaveAttribute('data-collapsed', 'true');
    expect(screen.getByRole('button', { name: '展开导航栏' })).toBeInTheDocument();
  });
});
