import { afterEach, beforeEach, vi } from 'vitest';

import { render, screen } from '@/test/render';
import { Generate } from '@/pages/Generate';

const apiGet = vi.fn();
const mockUseAuthStore = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: vi.fn(),
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector?: (state: { user: { id: number } | null }) => unknown) =>
    mockUseAuthStore(selector),
}));

describe('Generate', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        user: {
          id: 1,
          email: 'test@example.com',
          display_name: '测试用户',
        },
      };

      return typeof selector === 'function' ? selector(state) : state;
    });

    apiGet.mockResolvedValue({
      data: {
        price_cny_default: 1.5,
        price_cny_1k: 1.2,
        price_cny_2k: 1.5,
        price_cny_4k: 2.5,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses quick lab copy and reserve save-to-project action', async () => {
    render(<Generate />);

    expect(await screen.findByRole('heading', { name: 'Quick Lab' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存到项目（即将支持）' })).toBeInTheDocument();
  });
});
