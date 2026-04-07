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

      return Promise.reject(new Error(`unexpected GET ${url}`));
    });
    apiPost.mockReset();
    fetchAuthedBlob.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('uses quick lab copy and reserve save-to-project action', async () => {
    render(
      <MemoryRouter initialEntries={['/generate']}>
        <Routes>
          <Route path="/generate" element={<Generate />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Quick Lab' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存到项目（即将支持）' })).toBeInTheDocument();
  });

  it('shows retry guidance while quick lab generation is still processing', async () => {
    vi.useFakeTimers();
    apiPost.mockResolvedValue({
      data: {
        id: 'image-123',
      },
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

      if (url === '/images/image-123/status') {
        return Promise.resolve({
          data: {
            generation_status: 'processing',
            generation_error: '上游服务暂时不可用，系统正在自动重试（第 2 次，预计 120 秒后）',
          },
        });
      }

      return Promise.reject(new Error(`unexpected GET ${url}`));
    });

    render(
      <MemoryRouter initialEntries={['/generate']}>
        <Routes>
          <Route path="/generate" element={<Generate />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '生成一张测试图' } });
      fireEvent.click(screen.getByRole('button', { name: '开始试生成' }));
      await vi.advanceTimersByTimeAsync(3000);
      await Promise.resolve();
    });

    expect(screen.getByText('Academic Figure Generator is thinking...')).toBeInTheDocument();
    expect(
      screen.getByText('上游服务暂时不可用，系统正在自动重试（第 2 次，预计 120 秒后）'),
    ).toBeInTheDocument();
  });

  it('将失败状态里的英文底层错误翻译为更友好的中文提示', async () => {
    vi.useFakeTimers();
    apiPost.mockResolvedValue({
      data: {
        id: 'image-456',
      },
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

      if (url === '/images/image-456/status') {
        return Promise.resolve({
          data: {
            generation_status: 'failed',
            generation_error:
              "Server error '504 Gateway Timeout' for url 'https://wzw.pp.ua/v1/chat/completions'",
          },
        });
      }

      return Promise.reject(new Error(`unexpected GET ${url}`));
    });

    render(
      <MemoryRouter initialEntries={['/generate']}>
        <Routes>
          <Route path="/generate" element={<Generate />} />
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '生成一张测试图' } });
      fireEvent.click(screen.getByRole('button', { name: '开始试生成' }));
      await vi.advanceTimersByTimeAsync(3000);
      await Promise.resolve();
    });

    expect(screen.getByText('上游服务响应超时，请稍后重试。')).toBeInTheDocument();
  });
});
