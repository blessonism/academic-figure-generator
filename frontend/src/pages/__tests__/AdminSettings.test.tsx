import { beforeEach, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

import { render, screen, userEvent } from '@/test/render';
import { AdminSettings } from '@/pages/AdminSettings';

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

describe('AdminSettings', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPut.mockReset();
    apiPost.mockReset();

    const state = {
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        display_name: '管理员',
        is_admin: true,
        prompt_ai_available: false,
      },
      updateUser: vi.fn(),
    };

    mockUseAuthStore.mockImplementation((selector) => {
      return typeof selector === 'function' ? selector(state) : state;
    });

    apiGet.mockImplementation((url: string) => {
      if (url === '/admin/settings') {
        return Promise.resolve({
          data: {
            prompt_ai_provider: 'anthropic',
            prompt_ai_api_key_set: true,
            prompt_ai_api_base_url: null,
            prompt_ai_model: 'claude-sonnet-4-20250514',
            prompt_ai_effective_config: {
              provider: 'anthropic',
              api_base_url: 'https://api.anthropic.com',
              model: 'claude-sonnet-4-20250514',
              max_tokens: 8192,
              api_key_available: true,
              validation_status: 'valid',
              validation_message: null,
              sources: {
                provider: 'system',
                api_key: 'system',
                api_base_url: 'provider_default',
                model: 'system',
                max_tokens: 'service_default',
              },
            },
            nanobanana_api_key_set: false,
            nanobanana_api_base_url: null,
            nanobanana_model: null,
            paddleocr_server_url: null,
            paddleocr_api_key_set: false,
            image_price_cny: null,
            image_price_cny_1k: null,
            image_price_cny_2k: null,
            image_price_cny_4k: null,
            usd_cny_rate: null,
            prompt_ai_input_usd_per_million: null,
            prompt_ai_output_usd_per_million: null,
            linuxdo_client_id: null,
            linuxdo_client_secret_set: false,
            linuxdo_redirect_uri: null,
            epay_pid: null,
            epay_key_set: false,
            linuxdo_credits_per_cny: null,
          },
        });
      }

      if (url === '/auth/me') {
        return Promise.resolve({
          data: {
            id: 'admin-1',
            email: 'admin@example.com',
            display_name: '管理员',
            is_admin: true,
            prompt_ai_available: true,
            nanobanana_available: false,
            paddleocr_available: false,
          },
        });
      }

      return Promise.reject(new Error(`unexpected GET ${url}`));
    });

    apiPut.mockResolvedValue({
      data: {
        prompt_ai_provider: 'anthropic',
        prompt_ai_api_key_set: true,
        prompt_ai_api_base_url: null,
        prompt_ai_model: 'claude-sonnet-4-20250514',
        prompt_ai_effective_config: {
          provider: 'anthropic',
          api_base_url: 'https://api.anthropic.com',
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          api_key_available: true,
          validation_status: 'unknown',
          validation_message: '配置已保存，但尚未验证模型可用性。',
          sources: {
            provider: 'system',
            api_key: 'system',
            api_base_url: 'provider_default',
            model: 'system',
            max_tokens: 'service_default',
          },
        },
        nanobanana_api_key_set: false,
        nanobanana_api_base_url: null,
        nanobanana_model: null,
        paddleocr_server_url: null,
        paddleocr_api_key_set: false,
        image_price_cny: null,
        image_price_cny_1k: null,
        image_price_cny_2k: null,
        image_price_cny_4k: null,
        usd_cny_rate: null,
        prompt_ai_input_usd_per_million: null,
        prompt_ai_output_usd_per_million: null,
        linuxdo_client_id: null,
        linuxdo_client_secret_set: false,
        linuxdo_redirect_uri: null,
        epay_pid: null,
        epay_key_set: false,
        linuxdo_credits_per_cny: null,
      },
    });
  });

  it('refreshes current user capability flags after saving system settings', async () => {
    const user = userEvent.setup();
    const updateUser = mockUseAuthStore((state: { updateUser: () => void }) => state.updateUser) as ReturnType<typeof vi.fn>;

    render(<AdminSettings />);

    expect(await screen.findByRole('heading', { name: '系统管理' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '保存系统设置' }));

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/auth/me');
    });
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ prompt_ai_available: true }));
  });

  it('shows effective prompt ai config and can fetch model options', async () => {
    const user = userEvent.setup();

    apiPost.mockImplementation((url: string) => {
      if (url === '/admin/settings/prompt-ai/models') {
        return Promise.resolve({
          data: {
            provider: 'anthropic',
            models: [
              { id: 'claude-sonnet-4-20250514', display_name: 'Claude Sonnet 4' },
            ],
          },
        });
      }
      if (url === '/admin/settings/prompt-ai/resolve-preview') {
        return Promise.resolve({
          data: {
            provider: 'anthropic',
            api_base_url: 'https://api.anthropic.com',
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            api_key_available: true,
            validation_status: 'valid',
            validation_message: null,
            sources: {
              provider: 'system',
              api_key: 'system',
              api_base_url: 'provider_default',
              model: 'system',
              max_tokens: 'service_default',
            },
          },
        });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });

    render(<AdminSettings />);

    expect(await screen.findByRole('heading', { name: '系统管理' })).toBeInTheDocument();
    expect(screen.getByText('当前生效配置')).toBeInTheDocument();
    expect(screen.getByText('Provider 默认')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '拉取模型' }));

    expect(apiPost).toHaveBeenCalledWith(
      '/admin/settings/prompt-ai/models',
      expect.objectContaining({
        prompt_ai_provider: 'anthropic',
      }),
    );
    expect(await screen.findByText('Claude Sonnet 4')).toBeInTheDocument();
  });
});
