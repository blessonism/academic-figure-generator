import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { act, fireEvent } from '@testing-library/react';

import { render, screen } from '@/test/render';
import { Generate } from '@/pages/Generate';

const apiGet = vi.fn();
const apiPost = vi.fn();
const fetchAuthedBlob = vi.fn();
const mockUseAuthStore = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
  },
}));

vi.mock('@/lib/blob', () => ({
  fetchAuthedBlob: (...args: unknown[]) => fetchAuthedBlob(...args),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector?: (state: { user: { id: string } | null }) => unknown) =>
    mockUseAuthStore(selector),
}));

describe('Generate 市场垫图模式', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          display_name: '测试用户',
        },
      };

      return typeof selector === 'function' ? selector(state) : state;
    });

    apiGet.mockImplementation((url: string) => {
      if (url === '/images/pricing') {
        return Promise.resolve({
          data: {
            price_cny_default: 1.5,
            price_cny_1k: 1.2,
            price_cny_2k: 1.5,
            price_cny_4k: 2.5,
          },
        });
      }

      if (url === '/market/items/market-1') {
        return Promise.resolve({
          data: {
            id: 'market-1',
            title: '实验流程图',
            summary: '用于验证市场垫图模式',
            content_type: 'ai_generated',
            cover_download_url: '/api/v1/market/items/market-1/cover',
          },
        });
      }

      return Promise.reject(new Error(`unexpected GET ${url}`));
    });

    apiPost.mockReset();
    fetchAuthedBlob.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows market reference context and submits generate-from-reference request', async () => {
    apiPost.mockResolvedValue({
      data: {
        id: 'image-123',
      },
    });

    render(
      <MemoryRouter initialEntries={['/generate?referenceMarketItemId=market-1']}>
        <Routes>
          <Route path="/generate" element={<Generate />} />
        </Routes>
      </MemoryRouter>,
    );

    expect((await screen.findAllByText('市场垫图模式')).length).toBeGreaterThan(0);
    expect(screen.getByText('实验流程图')).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '请改成蓝绿色系的学术流程图' } });
      fireEvent.click(screen.getByRole('button', { name: '开始基于垫图生成' }));
    });

    expect(apiPost).toHaveBeenCalledWith('/market/items/market-1/generate-from-reference', {
      edit_instruction: '请改成蓝绿色系的学术流程图',
      aspect_ratio: '16:9',
    });
  });
});
