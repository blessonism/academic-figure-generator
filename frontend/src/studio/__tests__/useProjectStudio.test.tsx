import { renderHook, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProjectStudio } from '@/studio/useProjectStudio';

const apiGet = vi.fn();
const apiPost = vi.fn();
const mockUseAuthStore = vi.fn();
const mockUseProjectStore = vi.fn();
let localStorageStore = new Map<string, string>();
let promptListCallCount = 0;
const authState = {
  token: 'token-1',
  user: {
    id: 1,
    email: 'user@example.com',
    display_name: '测试用户',
    prompt_ai_available: true,
    nanobanana_available: true,
    paddleocr_available: true,
    default_resolution: '2K',
    default_aspect_ratio: '16:9',
    default_color_scheme: 'okabe-ito',
  },
};
const projectStoreState = {
  currentProject: {
    id: 42,
    name: '测试项目',
    color_scheme: 'okabe-ito',
  },
  setCurrentProject: vi.fn(),
};

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
  },
}));

vi.mock('@/lib/blob', () => ({
  fetchAuthedBlob: vi.fn(),
  triggerBrowserDownload: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector?: (state: unknown) => unknown) => mockUseAuthStore(selector),
}));

vi.mock('@/store/projectStore', () => ({
  useProjectStore: (selector?: (state: unknown) => unknown) => mockUseProjectStore(selector),
}));

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<>{children}</>} />
        </Routes>
      </MemoryRouter>
    );
  };
}

describe('useProjectStudio', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    promptListCallCount = 0;
    localStorageStore = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageStore.get(key) ?? null,
        setItem: (key: string, value: string) => {
          localStorageStore.set(key, value);
        },
        removeItem: (key: string) => {
          localStorageStore.delete(key);
        },
      },
      configurable: true,
    });

    projectStoreState.setCurrentProject.mockReset();

    mockUseAuthStore.mockImplementation((selector) => {
      return typeof selector === 'function' ? selector(authState) : authState;
    });

    mockUseProjectStore.mockImplementation((selector) => {
      return typeof selector === 'function' ? selector(projectStoreState) : projectStoreState;
    });

    apiGet.mockImplementation((url: string) => {
      if (url === '/projects/42') {
        return Promise.resolve({
          data: {
            id: 42,
            name: '测试项目',
            color_scheme: 'okabe-ito',
          },
        });
      }

      if (url === '/projects/42/documents') {
        return Promise.resolve({
          data: [
            {
              id: 'doc-1',
              original_filename: 'paper.pdf',
              parse_status: 'completed',
              sections: [
                { title: '1 Introduction', content: 'intro' },
                { title: '2 Method', content: 'method' },
              ],
            },
          ],
        });
      }

      if (url === '/projects/42/prompts') {
        promptListCallCount += 1;
        return Promise.resolve({
          data:
            promptListCallCount >= 2
              ? [
                  {
                    id: 'prompt-1',
                    figure_number: 1,
                    title: '草案 1',
                    suggested_figure_type: 'overall_framework',
                    generation_status: 'completed',
                    source_sections: [{ index: 0, title: '1 Introduction' }],
                  },
                ]
              : [],
        });
      }

      if (url === '/projects/42/images') {
        return Promise.resolve({ data: [] });
      }

      if (url === '/color-schemes/') {
        return Promise.resolve({ data: [{ name: 'okabe-ito', display_name: 'Okabe-Ito' }] });
      }

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

    apiPost.mockResolvedValue({ data: { task_id: 'task-1', status: 'pending' } });
  });

  it('在按章节自动推荐时提交 null figure_types', async () => {
    const { result } = renderHook(() => useProjectStudio(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasParsedDocument).toBe(true);
    });

    act(() => {
      result.current.handleConfirmScope();
      result.current.handlePromptModeChange('sections');
    });

    await act(async () => {
      await result.current.handleGeneratePromptDrafts();
    });

    expect(apiPost).toHaveBeenCalledWith('/projects/42/prompts/generate', expect.objectContaining({
      figure_types: null,
    }));
  });

  it('在按章节手动多选时提交稳定顺序的 figure_types 数组', async () => {
    const { result } = renderHook(() => useProjectStudio(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasParsedDocument).toBe(true);
    });

    act(() => {
      result.current.handleConfirmScope();
      result.current.handlePromptModeChange('sections');
      result.current.handleSectionPromptFigureTypeToggle('comparison_ablation');
      result.current.handleSectionPromptFigureTypeToggle('network_architecture');
    });

    await act(async () => {
      await result.current.handleGeneratePromptDrafts();
    });

    expect(apiPost).toHaveBeenCalledWith('/projects/42/prompts/generate', expect.objectContaining({
      figure_types: ['network_architecture', 'comparison_ablation'],
    }));
  });

  it('在草案异步任务失败时写回失败状态，供页面弹出 toast 并显示右侧提醒', async () => {
    let taskStatusCallCount = 0;

    apiGet.mockImplementation((url: string) => {
      if (url === '/projects/42') {
        return Promise.resolve({
          data: {
            id: 42,
            name: '测试项目',
            color_scheme: 'okabe-ito',
          },
        });
      }

      if (url === '/projects/42/documents') {
        return Promise.resolve({
          data: [
            {
              id: 'doc-1',
              original_filename: 'paper.pdf',
              parse_status: 'completed',
              sections: [
                { title: '1 Introduction', content: 'intro' },
                { title: '2 Method', content: 'method' },
              ],
            },
          ],
        });
      }

      if (url === '/projects/42/prompts') {
        return Promise.resolve({ data: [] });
      }

      if (url === '/projects/42/images') {
        return Promise.resolve({ data: [] });
      }

      if (url === '/color-schemes/') {
        return Promise.resolve({ data: [{ name: 'okabe-ito', display_name: 'Okabe-Ito' }] });
      }

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

      if (url === '/tasks/task-1') {
        taskStatusCallCount += 1;
        return Promise.resolve({
          data:
            taskStatusCallCount === 1
              ? { task_id: 'task-1', status: 'STARTED', detail: null }
              : {
                  task_id: 'task-1',
                  status: 'FAILURE',
                  detail: 'Prompt AI 连接失败：SSL EOF',
                },
        });
      }

      return Promise.reject(new Error(`unexpected GET ${url}`));
    });

    apiPost.mockResolvedValue({ data: { task_id: 'task-1', status: 'pending' } });

    const { result } = renderHook(() => useProjectStudio(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasParsedDocument).toBe(true);
    });

    act(() => {
      result.current.handleConfirmScope();
    });

    vi.useFakeTimers();

    try {
      await act(async () => {
        const promise = result.current.handleGeneratePromptDrafts();
        await vi.advanceTimersByTimeAsync(10_000);
        await promise;
      });
    } finally {
      vi.useRealTimers();
    }

    expect(result.current.statusMessage).toEqual({
      status: 'failed',
      detail: '草案生成失败：与上游服务的安全连接已中断，请稍后重试。',
    });
    expect(
      result.current.tasks.some(
        (task) =>
          task.type === '草案生成' &&
          task.status === 'failed' &&
          task.detail.includes('安全连接已中断'),
      ),
    ).toBe(true);
  });

  it('在 120 秒时仍保持草案生成中的等待状态，而不是过早判定失败', async () => {
    let shouldSucceed = false;

    apiGet.mockImplementation((url: string) => {
      if (url === '/projects/42') {
        return Promise.resolve({
          data: {
            id: 42,
            name: '测试项目',
            color_scheme: 'okabe-ito',
          },
        });
      }

      if (url === '/projects/42/documents') {
        return Promise.resolve({
          data: [
            {
              id: 'doc-1',
              original_filename: 'paper.pdf',
              parse_status: 'completed',
              sections: [
                { title: '1 Introduction', content: 'intro' },
                { title: '2 Method', content: 'method' },
              ],
            },
          ],
        });
      }

      if (url === '/projects/42/prompts') {
        promptListCallCount += 1;
        return Promise.resolve({
          data:
            promptListCallCount >= 2
              ? [
                  {
                    id: 'prompt-1',
                    figure_number: 1,
                    title: '草案 1',
                    suggested_figure_type: 'overall_framework',
                    generation_status: 'completed',
                    source_sections: [{ index: 0, title: '1 Introduction' }],
                  },
                ]
              : [],
        });
      }

      if (url === '/projects/42/images') {
        return Promise.resolve({ data: [] });
      }

      if (url === '/color-schemes/') {
        return Promise.resolve({ data: [{ name: 'okabe-ito', display_name: 'Okabe-Ito' }] });
      }

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

      if (url === '/tasks/task-1') {
        return Promise.resolve({
          data: {
            task_id: 'task-1',
            status: shouldSucceed ? 'SUCCESS' : 'STARTED',
            detail: null,
          },
        });
      }

      return Promise.reject(new Error(`unexpected GET ${url}`));
    });

    const { result } = renderHook(() => useProjectStudio(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasParsedDocument).toBe(true);
    });

    act(() => {
      result.current.handleConfirmScope();
    });

    vi.useFakeTimers();

    let generationPromise: Promise<void>;

    try {
      await act(async () => {
        generationPromise = result.current.handleGeneratePromptDrafts();
        await vi.advanceTimersByTimeAsync(120_000);
      });

      expect(result.current.statusMessage).toEqual({
        status: 'running',
        detail: '正在生成 Prompt 草案，请稍候。',
      });
      expect(
        result.current.tasks.some(
          (task) => task.id === 'prompt-generation' && task.status === 'running',
        ),
      ).toBe(true);

      shouldSucceed = true;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000);
        await generationPromise;
      });
    } finally {
      vi.useRealTimers();
    }

    expect(result.current.statusMessage).toEqual({
      status: 'completed',
      detail: '已生成 1 条草案，请先确认后再继续出图。',
    });
  });

  it('在图片仍为 processing 但错误详情不是自动重试提示时，将渲染资产归类为失败', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/projects/42') {
        return Promise.resolve({
          data: {
            id: 42,
            name: '测试项目',
            color_scheme: 'okabe-ito',
          },
        });
      }

      if (url === '/projects/42/documents') {
        return Promise.resolve({
          data: [
            {
              id: 'doc-1',
              original_filename: 'paper.pdf',
              parse_status: 'completed',
              sections: [
                { title: '1 Introduction', content: 'intro' },
              ],
            },
          ],
        });
      }

      if (url === '/projects/42/prompts') {
        return Promise.resolve({
          data: [
            {
              id: 'prompt-1',
              figure_number: 1,
              title: '草案 1',
              suggested_figure_type: 'overall_framework',
              original_prompt: '请生成整体框架图',
              generation_status: 'completed',
              source_sections: [{ index: 0, title: '1 Introduction' }],
            },
          ],
        });
      }

      if (url === '/projects/42/images') {
        return Promise.resolve({
          data: [
            {
              id: 'image-1',
              prompt_id: 'prompt-1',
              resolution: '2K',
              aspect_ratio: '16:9',
              color_scheme: 'okabe-ito',
              generation_status: 'processing',
              generation_error:
                "Server error '504 Gateway Timeout' for url 'https://wzw.pp.ua/v1/chat/completions'",
              created_at: '2026-04-07T10:00:00Z',
            },
          ],
        });
      }

      if (url === '/color-schemes/') {
        return Promise.resolve({ data: [{ name: 'okabe-ito', display_name: 'Okabe-Ito' }] });
      }

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

    const { result } = renderHook(() => useProjectStudio(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.promptDrafts).toHaveLength(1);
    });

    act(() => {
      result.current.handleDraftStatusChange('prompt-1', 'accepted');
    });

    await waitFor(() => {
      expect(result.current.renderAssets).toHaveLength(1);
    });

    expect(result.current.renderAssets[0]).toMatchObject({
      status: 'failed',
      rawStatus: 'processing',
      generationError: '上游服务响应超时，请稍后重试。',
    });
    expect(
      result.current.tasks.some(
        (task) =>
          task.id === 'render-failed' &&
          task.status === 'failed' &&
          task.detail.includes('部分图片生成失败'),
      ),
    ).toBe(true);
  });

  it('兼容旧的 source_sections.titles 结构并映射为可展示的来源章节', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/projects/42') {
        return Promise.resolve({
          data: {
            id: 42,
            name: '测试项目',
            color_scheme: 'okabe-ito',
          },
        });
      }

      if (url === '/projects/42/documents') {
        return Promise.resolve({
          data: [
            {
              id: 'doc-1',
              original_filename: 'paper.pdf',
              parse_status: 'completed',
              sections: [
                { title: '1 Introduction', content: 'intro' },
                { title: '2 Method', content: 'method' },
              ],
            },
          ],
        });
      }

      if (url === '/projects/42/prompts') {
        return Promise.resolve({
          data: [
            {
              id: 'prompt-1',
              figure_number: 1,
              title: '草案 1',
              suggested_figure_type: 'overall_framework',
              original_prompt: '请生成整体框架图',
              generation_status: 'completed',
              source_sections: {
                titles: ['1 Introduction', '2 Method'],
                rationale: '覆盖论文主线与方法实现。',
              },
            },
          ],
        });
      }

      if (url === '/projects/42/images') {
        return Promise.resolve({ data: [] });
      }

      if (url === '/color-schemes/') {
        return Promise.resolve({ data: [{ name: 'okabe-ito', display_name: 'Okabe-Ito' }] });
      }

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

    const { result } = renderHook(() => useProjectStudio(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.promptDrafts).toHaveLength(1);
    });

    expect(result.current.promptDrafts[0].sourceSections).toEqual([
      { index: 0, title: '1 Introduction' },
      { index: 1, title: '2 Method' },
    ]);
  });
});
