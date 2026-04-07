import { vi } from 'vitest';
import { waitFor } from '@testing-library/react';

import { ReviewStage } from '@/components/studio/stages/ReviewStage';
import type { StudioReviewAsset } from '@/studio/types';
import { render, screen, userEvent } from '@/test/render';

function createReviewStageProps() {
  const assets: StudioReviewAsset[] = [
    {
      id: 'draft-1',
      promptId: 'draft-1',
      title: '图 1',
      figureType: 'overall_framework',
      promptText: '请生成整体框架图',
      finalVersionId: null,
      versions: [
        {
          id: 'image-1',
          imageId: 'image-1',
          label: '原始生成',
          status: 'completed',
          createdAt: '2026-03-26T10:00:00Z',
          previewUrl: 'blob:preview-1',
          generationError: null,
          editInstruction: null,
          resolution: '2K',
          aspectRatio: '16:9',
          colorScheme: 'okabe-ito',
          isPreviewLoading: false,
          isDownloading: false,
        },
      ],
    },
  ];

  return {
    assets,
    statusMessage: null,
    onEditAsset: vi.fn(),
    onMarkVersionFinal: vi.fn(),
    onPreviewAsset: vi.fn(),
    onDownloadAsset: vi.fn(),
  };
}

describe('ReviewStage', () => {
  it('organizes review into result list, current detail, edit actions and delivery summary', () => {
    const { container } = render(<ReviewStage {...createReviewStageProps()} />);
    const reviewGrid = container.querySelector('div.grid.gap-4');
    const resultListCard = screen.getByRole('heading', { name: '结果清单' }).closest('.rounded-lg');

    expect(reviewGrid).toHaveClass('xl:grid-cols-[minmax(0,1fr)_320px]');
    expect(reviewGrid).toHaveClass('2xl:grid-cols-[280px_minmax(0,1fr)_320px]');
    expect(resultListCard).toHaveClass('xl:col-span-2');
    expect(screen.getByRole('heading', { name: '结果清单' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '当前版本详情' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '精修动作' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '交付摘要' })).toBeInTheDocument();
  });

  it('shows selected asset preview with version timeline and final action', () => {
    render(<ReviewStage {...createReviewStageProps()} />);

    expect(screen.getByRole('img', { name: '图 1 预览' })).toBeInTheDocument();
    expect(screen.getByText('结果清单')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '标记为最终稿' })).toBeInTheDocument();
  });

  it('auto loads preview for a completed version without preview url', async () => {
    const onPreviewAsset = vi.fn();

    render(
      <ReviewStage
        {...createReviewStageProps()}
        onPreviewAsset={onPreviewAsset}
        assets={[
          {
            ...createReviewStageProps().assets[0],
            versions: [
              {
                ...createReviewStageProps().assets[0].versions[0],
                previewUrl: null,
              },
            ],
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(onPreviewAsset).toHaveBeenCalledWith('image-1');
    });
    expect(screen.queryByRole('button', { name: '加载预览' })).not.toBeInTheDocument();
  });

  it('auto loads preview when switching to another completed version without preview url', async () => {
    const user = userEvent.setup();
    const onPreviewAsset = vi.fn();

    render(
      <ReviewStage
        {...createReviewStageProps()}
        onPreviewAsset={onPreviewAsset}
        assets={[
          {
            ...createReviewStageProps().assets[0],
            versions: [
              {
                ...createReviewStageProps().assets[0].versions[0],
                id: 'image-2',
                imageId: 'image-2',
                label: '精修 1',
                createdAt: '2026-03-26T10:10:00Z',
                previewUrl: 'blob:preview-2',
              },
              {
                ...createReviewStageProps().assets[0].versions[0],
                id: 'image-1',
                imageId: 'image-1',
                label: '原始生成',
                previewUrl: null,
              },
            ],
          },
        ]}
      />,
    );

    expect(onPreviewAsset).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /原始生成/ }));

    await waitFor(() => {
      expect(onPreviewAsset).toHaveBeenCalledWith('image-1');
    });
  });

  it('allows long result titles to wrap inside the result list', () => {
    render(
      <ReviewStage
        {...createReviewStageProps()}
        assets={[
          {
            ...createReviewStageProps().assets[0],
            title: '这是一个很长的结果标题用于确认结果清单在窄宽度下会自动换行而不是继续把内容挤出容器',
          },
        ]}
      />,
    );

    const title = screen.getAllByText(
      '这是一个很长的结果标题用于确认结果清单在窄宽度下会自动换行而不是继续把内容挤出容器',
    )[0];

    expect(title).toHaveClass('line-clamp-2');
    expect(title).toHaveClass('break-words');
    expect(title).not.toHaveClass('truncate');
  });

  it('submits edit instruction for the selected version', async () => {
    const user = userEvent.setup();
    const onEditAsset = vi.fn();

    render(
      <ReviewStage
        {...createReviewStageProps()}
        onEditAsset={onEditAsset}
      />,
    );

    await user.type(
      screen.getByPlaceholderText('描述你想调整的内容，例如：加粗主路径并弱化背景模块。'),
      '强化主干流程并弱化背景模块',
    );
    await user.click(screen.getByRole('button', { name: '提交精修' }));

    expect(onEditAsset).toHaveBeenCalledWith('image-1', '强化主干流程并弱化背景模块');
  });

  it('shows retry guidance when the selected version is still processing', () => {
    render(
      <ReviewStage
        {...createReviewStageProps()}
        assets={[
          {
            id: 'draft-1',
            promptId: 'draft-1',
            title: '图 1',
            figureType: 'overall_framework',
            promptText: '请生成整体框架图',
            finalVersionId: null,
            versions: [
              {
                id: 'image-2',
                imageId: 'image-2',
                label: '精修 1',
                status: 'processing',
                createdAt: '2026-03-26T10:05:00Z',
                previewUrl: null,
                generationError: '上游服务暂时不可用，系统正在自动重试（第 2 次，预计 120 秒后）',
                editInstruction: '细化主路径',
                resolution: '2K',
                aspectRatio: '16:9',
                colorScheme: 'okabe-ito',
                isPreviewLoading: false,
                isDownloading: false,
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('系统正在自动重试')).toBeInTheDocument();
    expect(screen.getByText('上游服务暂时不可用，系统正在自动重试（第 2 次，预计 120 秒后）')).toBeInTheDocument();
  });
});
