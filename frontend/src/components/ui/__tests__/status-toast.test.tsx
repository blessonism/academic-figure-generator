import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

import { render, screen, userEvent } from '@/test/render';
import { StatusToast } from '@/components/ui/status-toast';

describe('StatusToast', () => {
  it('renders a closable toast and calls onClose when dismissed manually', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <StatusToast
        message={{ status: 'failed', detail: '草案生成失败：连接异常' }}
        onClose={onClose}
      />,
    );

    expect(await screen.findByText('草案生成失败：连接异常')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '关闭提示' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('stacks multiple error toasts instead of replacing the previous one', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <StatusToast
        message={{ status: 'failed', detail: '草案生成失败：连接异常' }}
        onClose={onClose}
      />,
    );

    expect(await screen.findByText('草案生成失败：连接异常')).toBeInTheDocument();

    rerender(
      <StatusToast
        message={{ status: 'failed', detail: '图片渲染失败：服务超时' }}
        onClose={onClose}
      />,
    );

    expect(await screen.findByText('图片渲染失败：服务超时')).toBeInTheDocument();
    expect(screen.getByText('草案生成失败：连接异常')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('renders a wider toast container for long status messages', async () => {
    const onClose = vi.fn();

    render(
      <StatusToast
        message={{ status: 'failed', detail: '这是一条比较长的错误信息，用来验证 toast 宽度是否足够，不会显得过窄。' }}
        onClose={onClose}
      />,
    );

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveClass('w-[min(28rem,calc(100vw-2rem))]');
    expect(toast).toHaveClass('sm:min-w-[28rem]');
  });

  it('collapses older toasts beyond the latest three until hover expands the stack', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <StatusToast
        message={{ status: 'failed', detail: '第 1 条状态消息' }}
        onClose={onClose}
      />,
    );

    expect(await screen.findByText('第 1 条状态消息')).toBeInTheDocument();

    rerender(
      <StatusToast
        message={{ status: 'failed', detail: '第 2 条状态消息' }}
        onClose={onClose}
      />,
    );
    expect(await screen.findByText('第 2 条状态消息')).toBeInTheDocument();

    rerender(
      <StatusToast
        message={{ status: 'failed', detail: '第 3 条状态消息' }}
        onClose={onClose}
      />,
    );
    expect(await screen.findByText('第 3 条状态消息')).toBeInTheDocument();

    rerender(
      <StatusToast
        message={{ status: 'failed', detail: '第 4 条状态消息' }}
        onClose={onClose}
      />,
    );
    expect(await screen.findByText('第 4 条状态消息')).toBeInTheDocument();

    const oldestToast = screen.getByText('第 1 条状态消息').closest('[role="alert"]');
    expect(oldestToast).toHaveAttribute('data-collapsed-hidden', 'true');

    const region = document.querySelector('[data-testid="status-toast-region"]');
    expect(region).not.toBeNull();

    await user.hover(region as HTMLElement);

    await waitFor(() => {
      expect(oldestToast).toHaveAttribute('data-collapsed-hidden', 'false');
    });
  });
});
