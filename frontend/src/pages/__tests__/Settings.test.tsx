import { beforeEach, expect, it, vi } from 'vitest';

import { render, screen, userEvent } from '@/test/render';
import { Settings } from '@/pages/Settings';

const apiGet = vi.fn();
const apiPut = vi.fn();
const apiPost = vi.fn();
const mockUseAuthStore = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    put: (...args: unknown[]) => apiPut(...args),
    post: (...args: unknown[]) => apiPost(...args),
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector?: (state: unknown) => unknown) => mockUseAuthStore(selector),
}));

describe('Settings', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPut.mockReset();
    apiPost.mockReset();
    apiPost.mockImplementation((url: string) => {
      if (url === '/auth/me/prompt-ai/resolve-preview') {
        return Promise.resolve({
          data: {
            provider: 'openai-compatible',
            api_base_url: 'https://wzw.pp.ua/',
            model: 'grok-4.1-expert',
            max_tokens: 8192,
            api_key_available: true,
            validation_status: 'valid',
            validation_message: null,
            sources: {
              provider: 'user',
              api_key: 'user',
              api_base_url: 'user',
              model: 'system',
              max_tokens: 'service_default',
            },
          },
        });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });
    apiGet.mockResolvedValue({
      data: [
        {
          id: 'preset-okabe-ito',
          name: 'Okabe-Ito',
          type: 'preset',
          colors: {
            primary: '#0072B2',
            secondary: '#E69F00',
            tertiary: '#009E73',
            text: '#333333',
            fill: '#FFFFFF',
            section_bg: '#F7F7F7',
            border: '#CCCCCC',
            arrow: '#4D4D4D',
          },
        },
      ],
    });
    const state = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        display_name: '测试用户',
        default_color_scheme: 'okabe-ito',
        default_resolution: '2K',
        default_aspect_ratio: '16:9',
        prompt_ai_provider: 'openai-compatible',
        prompt_ai_api_key_set: true,
        prompt_ai_api_base_url: 'https://wzw.pp.ua/',
        prompt_ai_model: 'grok-4.1-expert',
        prompt_ai_effective_config: {
          provider: 'openai-compatible',
          api_base_url: 'https://wzw.pp.ua/',
          model: 'grok-4.1-expert',
          max_tokens: 8192,
          api_key_available: true,
          validation_status: 'valid',
          validation_message: null,
          sources: {
            provider: 'user',
            api_key: 'user',
            api_base_url: 'user',
            model: 'system',
            max_tokens: 'service_default',
          },
        },
        linuxdo_id: null,
      },
      updateUser: vi.fn(),
    };
    mockUseAuthStore.mockImplementation((selector) => {
      return typeof selector === 'function' ? selector(state) : state;
    });
  });

  it('shows account, AI and preference settings in personal settings', async () => {
    render(<Settings />);

    expect(await screen.findByRole('heading', { name: '应用设置' })).toBeInTheDocument();
    expect(screen.getByText('AI 配置')).toBeInTheDocument();
    expect(screen.getByText('个人偏好')).toBeInTheDocument();
    expect(screen.getByText('这里仅管理您的账户资料、登录安全、AI 配置与个人偏好。平台能力配置统一由管理员维护。')).toBeInTheDocument();
    expect(screen.getByLabelText('AI 请求地址')).toHaveValue('https://wzw.pp.ua/');
    expect(screen.getByRole('button', { name: '保存 AI 配置' })).toBeInTheDocument();
    expect(screen.getByText('当前生效配置')).toBeInTheDocument();
    expect(screen.getByText('grok-4.1-expert')).toBeInTheDocument();
    expect(screen.getByText('系统配置')).toBeInTheDocument();
    expect(screen.getByText('服务默认')).toBeInTheDocument();
    expect(screen.getByLabelText('默认配色方案')).toBeInTheDocument();
    expect(screen.getByLabelText('默认分辨率')).toBeInTheDocument();
    expect(screen.getByLabelText('默认画面比例')).toBeInTheDocument();
  });

  it('saves personal AI settings through the profile endpoint', async () => {
    const user = userEvent.setup();

    apiPut.mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'test@example.com',
        display_name: '测试用户',
        default_color_scheme: 'okabe-ito',
        default_resolution: '2K',
        default_aspect_ratio: '16:9',
        prompt_ai_provider: 'openai-compatible',
        prompt_ai_api_key_set: true,
        prompt_ai_api_base_url: 'https://wzw.pp.ua/',
        prompt_ai_model: 'grok-4.1-expert',
        prompt_ai_effective_config: {
          provider: 'openai-compatible',
          api_base_url: 'https://wzw.pp.ua/',
          model: 'grok-4.1-expert',
          max_tokens: 8192,
          api_key_available: true,
          validation_status: 'unknown',
          validation_message: '配置已保存，但尚未验证模型可用性。',
          sources: {
            provider: 'user',
            api_key: 'user',
            api_base_url: 'user',
            model: 'env',
            max_tokens: 'service_default',
          },
        },
        linuxdo_id: null,
      },
    });

    render(<Settings />);

    await screen.findByRole('heading', { name: '应用设置' });

    const urlInput = screen.getByLabelText('AI 请求地址');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://wzw.pp.ua/');
    await user.click(screen.getByRole('button', { name: '保存 AI 配置' }));

    expect(apiPut).toHaveBeenCalledWith(
      '/auth/me',
      expect.objectContaining({
        prompt_ai_provider: 'openai-compatible',
        prompt_ai_api_base_url: 'https://wzw.pp.ua/',
        prompt_ai_model: 'grok-4.1-expert',
      }),
    );
  });

  it('fetches available models and shows effective config preview', async () => {
    const user = userEvent.setup();

    apiPost.mockImplementation((url: string) => {
      if (url === '/auth/me/prompt-ai/models') {
        return Promise.resolve({
          data: {
            provider: 'openai-compatible',
            models: [
              { id: 'grok-4.1-expert', display_name: 'Grok 4.1 Expert' },
            ],
          },
        });
      }
      if (url === '/auth/me/prompt-ai/resolve-preview') {
        return Promise.resolve({
          data: {
            provider: 'openai-compatible',
            api_base_url: 'https://wzw.pp.ua/',
            model: 'grok-4.1-expert',
            max_tokens: 8192,
            api_key_available: true,
            validation_status: 'valid',
            validation_message: null,
            sources: {
              provider: 'user',
              api_key: 'user',
              api_base_url: 'user',
              model: 'user',
              max_tokens: 'service_default',
            },
          },
        });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });

    render(<Settings />);

    await screen.findByRole('heading', { name: '应用设置' });
    await user.click(screen.getByRole('button', { name: '拉取模型' }));

    expect(apiPost).toHaveBeenCalledWith(
      '/auth/me/prompt-ai/models',
      expect.objectContaining({
        prompt_ai_provider: 'openai-compatible',
      }),
    );
    expect(await screen.findByText('Grok 4.1 Expert')).toBeInTheDocument();
  });
});
