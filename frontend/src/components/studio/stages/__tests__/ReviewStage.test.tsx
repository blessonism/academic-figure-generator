import { vi } from 'vitest';

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
  it('shows selected asset preview with version timeline and final action', () => {
    render(<ReviewStage {...createReviewStageProps()} />);

    expect(screen.getByRole('img', { name: '图 1 预览' })).toBeInTheDocument();
    expect(screen.getByText('结果清单')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '标记为最终稿' })).toBeInTheDocument();
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
});
