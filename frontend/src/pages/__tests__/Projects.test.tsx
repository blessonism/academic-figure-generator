import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';

import { render, screen } from '@/test/render';
import { Projects } from '@/pages/Projects';
import { useProjectStore } from '@/store/projectStore';

const apiGet = vi.fn();
const mockUseAuthStore = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { token: string | null }) => unknown) =>
    mockUseAuthStore(selector),
}));

describe('Projects', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        token: 'test-token',
      }),
    );

    apiGet.mockResolvedValue({
      data: {
        items: [
          {
            id: 1,
            name: '空项目',
            description: null,
            paper_field: '计算机视觉',
            color_scheme: 'okabe-ito',
            status: 'active',
            created_at: '2026-03-26T10:00:00Z',
            document_count: 0,
            prompt_count: 0,
            image_count: 0,
          },
          {
            id: 2,
            name: '待范围确认项目',
            description: null,
            paper_field: '计算机视觉',
            color_scheme: 'okabe-ito',
            status: 'active',
            created_at: '2026-03-26T10:00:00Z',
            document_count: 1,
            prompt_count: 0,
            image_count: 0,
          },
          {
            id: 3,
            name: '待精修项目',
            description: null,
            paper_field: '计算机视觉',
            color_scheme: 'okabe-ito',
            status: 'active',
            created_at: '2026-03-26T10:00:00Z',
            document_count: 1,
            prompt_count: 2,
            image_count: 3,
          },
        ],
      },
    });
  });

  afterEach(() => {
    useProjectStore.getState().clearState();
    vi.clearAllMocks();
  });

  it('shows derived progress summary on project cards', async () => {
    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>,
    );

    expect(await screen.findByText('待上传文档')).toBeInTheDocument();
    expect(screen.getByText('待确认范围')).toBeInTheDocument();
    expect(screen.getByText('待精修')).toBeInTheDocument();
  });
});
