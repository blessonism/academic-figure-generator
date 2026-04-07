import { describe, expect, it } from 'vitest';

import { getApiErrorMessage, humanizeErrorText } from '@/lib/apiError';

describe('apiError', () => {
  it('将 504 Gateway Timeout 翻译为友好的中文提示', () => {
    expect(
      humanizeErrorText("Server error '504 Gateway Timeout' for url 'https://example.com/v1/chat/completions'"),
    ).toBe('上游服务响应超时，请稍后重试。');
  });

  it('将 SSL EOF 连接错误翻译为友好的中文提示', () => {
    expect(
      humanizeErrorText('ConnectError: [SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol'),
    ).toBe('与上游服务的安全连接已中断，请稍后重试。');
  });

  it('将 JSONDecodeError 翻译为友好的中文提示', () => {
    expect(
      humanizeErrorText("Expecting value: line 1 column 1 (char 0)"),
    ).toBe('上游服务返回了空响应或非标准数据，请稍后重试。');
  });

  it('保留明确的自动重试提示', () => {
    expect(
      humanizeErrorText('上游服务暂时不可用，系统正在自动重试（第 2 次，预计 120 秒后）'),
    ).toBe('上游服务暂时不可用，系统正在自动重试（第 2 次，预计 120 秒后）');
  });

  it('让 getApiErrorMessage 复用友好翻译规则', () => {
    expect(
      getApiErrorMessage(
        {
          response: {
            data: {
              detail: "Server error '504 Gateway Timeout' for url 'https://example.com/v1/chat/completions'",
            },
          },
        },
        '请求失败，请稍后重试。',
      ),
    ).toBe('上游服务响应超时，请稍后重试。');
  });
});
