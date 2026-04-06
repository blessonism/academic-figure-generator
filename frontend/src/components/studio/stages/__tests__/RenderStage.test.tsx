import { render, screen, userEvent } from '@/test/render';

import { RenderStage } from '@/components/studio/stages/RenderStage';

function createRenderStageProps() {
  return {
    projectDefaults: {
      resolution: '2K',
      aspectRatio: '16:9',
      colorScheme: 'okabe-ito',
    },
    sessionDefaults: {
      resolution: '2K',
      aspectRatio: '16:9',
      colorScheme: 'okabe-ito',
    },
    colorSchemeOptions: [
      {
        value: 'okabe-ito',
        label: 'Okabe-Ito',
      },
    ],
    imagePricing: {
      priceCnyDefault: 1.5,
      priceCny1K: 1.2,
      priceCny2K: 1.5,
      priceCny4K: 2.5,
    },
    statusMessage: null,
    assets: [],
    onSessionDefaultsChange: () => {},
    onAssetOverrideChange: () => {},
    onResetAssetOverrides: () => {},
    onGenerateAsset: () => {},
    onPreviewAsset: () => {},
    onDownloadAsset: () => {},
  };
}

describe('RenderStage', () => {
  it('shows shared defaults above result grid', () => {
    render(<RenderStage {...createRenderStageProps()} />);

    expect(screen.getByText('本次默认参数')).toBeInTheDocument();
    expect(screen.getByText('项目默认参数')).toBeInTheDocument();
  });

  it('filters assets by generation status', async () => {
    const user = userEvent.setup();

    render(
      <RenderStage
        {...createRenderStageProps()}
        assets={[
          {
            id: 'asset-processing',
            promptId: 'draft-1',
            title: '图 1',
            figureType: 'overall_framework',
            status: 'processing',
            rawStatus: 'processing',
            promptText: 'processing prompt',
            latestImageId: 'image-1',
            previewUrl: null,
            generationError: null,
            effectiveSettings: {
              resolution: '2K',
              aspectRatio: '16:9',
              colorScheme: 'okabe-ito',
            },
            overrideSettings: {},
          },
          {
            id: 'asset-completed',
            promptId: 'draft-2',
            title: '图 2',
            figureType: 'result_comparison',
            status: 'completed',
            rawStatus: 'completed',
            promptText: 'completed prompt',
            latestImageId: 'image-2',
            previewUrl: null,
            generationError: null,
            effectiveSettings: {
              resolution: '4K',
              aspectRatio: '4:3',
              colorScheme: 'okabe-ito',
            },
            overrideSettings: {
              resolution: '4K',
            },
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: '处理中' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '已完成' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '已完成' }));

    expect(screen.queryByText('图 1')).not.toBeInTheDocument();
    expect(screen.getByText('图 2')).toBeInTheDocument();
  });

  it('keeps retry preview and download actions for completed assets', () => {
    render(
      <RenderStage
        {...createRenderStageProps()}
        assets={[
          {
            id: 'asset-completed',
            promptId: 'draft-2',
            title: '图 2',
            figureType: 'result_comparison',
            status: 'completed',
            rawStatus: 'completed',
            promptText: 'completed prompt',
            latestImageId: 'image-2',
            previewUrl: null,
            generationError: null,
            effectiveSettings: {
              resolution: '2K',
              aspectRatio: '16:9',
              colorScheme: 'okabe-ito',
            },
            overrideSettings: {},
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: '重新生成' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '预览' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下载' })).toBeInTheDocument();
  });

  it('shows retry guidance when a processing asset already has generation error details', () => {
    render(
      <RenderStage
        {...createRenderStageProps()}
        assets={[
          {
            id: 'asset-processing',
            promptId: 'draft-3',
            title: '图 3',
            figureType: 'methodology',
            status: 'processing',
            rawStatus: 'processing',
            promptText: 'processing prompt',
            latestImageId: 'image-3',
            previewUrl: null,
            generationError: '上游服务暂时不可用，系统正在自动重试（第 2 次，预计 120 秒后）',
            effectiveSettings: {
              resolution: '2K',
              aspectRatio: '16:9',
              colorScheme: 'okabe-ito',
            },
            overrideSettings: {},
          },
        ]}
      />,
    );

    expect(screen.getByText('系统正在自动重试')).toBeInTheDocument();
    expect(screen.getByText('上游服务暂时不可用，系统正在自动重试（第 2 次，预计 120 秒后）')).toBeInTheDocument();
  });
});
