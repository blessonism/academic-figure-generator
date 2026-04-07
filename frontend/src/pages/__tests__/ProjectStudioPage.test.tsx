import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { waitFor } from '@testing-library/react';

import { render, screen } from '@/test/render';
import { ProjectStudioPage } from '@/pages/ProjectStudioPage';

const createStudioState = (overrides: Record<string, unknown> = {}) => ({
  currentProject: { name: '测试项目' },
  currentStage: 'ingest',
  documents: [],
  confirmedScopeSummary: null,
  handleDownloadMarkdown: () => {},
  handleConfirmScope: () => {},
  handleDraftPromptChange: () => {},
  handleDraftStatusChange: () => {},
  handleFileChange: () => {},
  handleGeneratePromptDrafts: () => {},
  handleGenerateRenderAsset: () => {},
  handleScopeModeChange: () => {},
  handleScopePresetSelect: () => {},
  handleSelectedSectionIndicesChange: () => {},
  handleTemplateModeChange: () => {},
  handlePromptModeChange: () => {},
  handleOverallPromptFigureTypeChange: () => {},
  handleSectionPromptFigureTypeToggle: () => {},
  handleSectionPromptFigureTypesReset: () => {},
  handlePromptRequestChange: () => {},
  handleRenderAssetOverrideChange: () => {},
  handleRenderAssetPreview: () => {},
  handleRenderAssetDownload: () => {},
  handleReviewAssetEdit: () => {},
  handleReviewAssetMarkFinal: () => {},
  handleRenderFilterChange: () => {},
  handleRenderSessionDefaultsChange: () => {},
  handleResetRenderAssetOverrides: () => {},
  handleSaveDraftPrompt: () => {},
  handleStageChange: () => {},
  handleTriggerOcr: () => {},
  hasConfirmedScope: false,
  isCurrentScopeConfirmed: false,
  hasOcrConfig: true,
  hasParsedDocument: false,
  healthItems: [],
  isGeneratingDrafts: false,
  isLoading: false,
  savingPromptIds: {},
  isUploading: false,
  ocrLoading: {},
  parsedDocument: null,
  parsedSections: [],
  projectId: '42',
  promptDrafts: [],
  promptMode: 'overall',
  overallPromptFigureType: 'overall_framework',
  sectionPromptFigureTypes: [],
  promptRequest: '',
  renderAssets: [],
  reviewAssets: [],
  renderCompletedCount: 0,
  renderFailedCount: 0,
  renderFilter: 'all',
  renderProcessingCount: 0,
  renderProjectDefaults: {
    resolution: '2K',
    aspectRatio: '16:9',
    colorScheme: 'okabe-ito',
  },
  renderSessionDefaults: {
    resolution: '2K',
    aspectRatio: '16:9',
    colorScheme: 'okabe-ito',
  },
  renderColorSchemeOptions: [{ value: 'okabe-ito', label: 'Okabe-Ito' }],
  renderImagePricing: null,
  scopeMode: 'preset',
  selectedScopePresetId: 'full-paper',
  selectedSectionIndices: [],
  statusMessage: null,
  tasks: [],
  templateMode: false,
  uploadProgress: 0,
  ...overrides,
});

const mockUseProjectStudio = vi.fn(() => createStudioState());

vi.mock('@/studio/useProjectStudio', () => ({
  useProjectStudio: () => mockUseProjectStudio(),
}));

describe('ProjectStudioPage', () => {
  beforeEach(() => {
    mockUseProjectStudio.mockReturnValue(createStudioState());
  });

  it('renders v2 style studio frame for /projects/:id', () => {
    render(
      <MemoryRouter initialEntries={['/projects/42']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('研究型工作台')).toBeInTheDocument();
    expect(screen.getByText('专业摘要面板')).toBeInTheDocument();
  });

  it('renders prompt stage when prompt drafts are available', () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        hasConfirmedScope: true,
        hasParsedDocument: true,
        confirmedScopeSummary: {
          label: '整篇论文',
          sectionCount: 6,
          documentName: 'paper.pdf',
        },
        promptDrafts: [
          {
            id: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            status: 'pending',
            promptText: '请生成整体架构图',
            generationStatus: 'completed',
            sourceSections: [{ index: 0, title: '1 Introduction' }],
          },
        ],
      }),
    );

    render(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('整体架构图').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '接受' })).toBeInTheDocument();
    expect(screen.getByText('已确认范围')).toBeInTheDocument();
  });

  it('在收到失败状态时显示 toast 提醒', async () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        statusMessage: {
          status: 'failed',
          detail: '草案生成失败：与上游服务的安全连接已中断，请稍后重试。',
        },
      }),
    );

    render(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('草案生成失败：与上游服务的安全连接已中断，请稍后重试。');
  });

  it('在手动关闭后再次收到同一条失败状态时会重新显示 toast', async () => {
    const user = userEvent.setup();

    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        statusMessage: {
          status: 'failed',
          detail: '草案生成失败：与上游服务的安全连接已中断，请稍后重试。',
        },
      }),
    );

    const view = render(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '草案生成失败：与上游服务的安全连接已中断，请稍后重试。',
    );

    await user.click(screen.getByRole('button', { name: '关闭提示' }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        statusMessage: {
          status: 'failed',
          detail: '草案生成失败：与上游服务的安全连接已中断，请稍后重试。',
        },
      }),
    );

    view.rerender(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '草案生成失败：与上游服务的安全连接已中断，请稍后重试。',
    );
  });

  it('在手动关闭后遇到无关重渲染时不会把同一条旧失败 toast 再弹出来', async () => {
    const user = userEvent.setup();
    const persistentStatusMessage = {
      status: 'failed' as const,
      detail: '草案生成失败：与上游服务的安全连接已中断，请稍后重试。',
    };

    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        statusMessage: persistentStatusMessage,
        uploadProgress: 10,
      }),
    );

    const view = render(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '草案生成失败：与上游服务的安全连接已中断，请稍后重试。',
    );

    await user.click(screen.getByRole('button', { name: '关闭提示' }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        statusMessage: persistentStatusMessage,
        uploadProgress: 25,
      }),
    );

    view.rerender(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('在草案生成返回非重试错误详情时显示失败 toast，而不是处理中', async () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        hasConfirmedScope: true,
        hasParsedDocument: true,
        isGeneratingDrafts: true,
        statusMessage: {
          status: 'running',
          detail: '正在生成 Prompt 草案，请稍候。',
        },
      }),
    );

    const view = render(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        hasConfirmedScope: true,
        hasParsedDocument: true,
        isGeneratingDrafts: true,
        statusMessage: {
          status: 'running',
          detail: 'ConnectError: [SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol',
        },
      }),
    );

    view.rerender(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      const failedToast = screen
        .getAllByRole('alert')
        .find((toast) => toast.textContent?.includes('操作失败'));

      expect(failedToast).toBeDefined();
      expect(failedToast).toHaveTextContent(
        '草案生成失败：与上游服务的安全连接已中断，请稍后重试。',
      );
    });
  });

  it('在草案初始生成中时显示运行中 toast', async () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        hasConfirmedScope: true,
        hasParsedDocument: true,
        isGeneratingDrafts: true,
        statusMessage: {
          status: 'running',
          detail: '正在生成 Prompt 草案，请稍候。',
        },
      }),
    );

    render(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('正在生成 Prompt 草案，请稍候。');
    expect(toast).toHaveTextContent('处理中');
  });

  it('在运行中状态结束后会移除无限时长的处理中 toast', async () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        hasConfirmedScope: true,
        hasParsedDocument: true,
        isGeneratingDrafts: true,
        statusMessage: {
          status: 'running',
          detail: '正在生成 Prompt 草案，请稍候。',
        },
      }),
    );

    const view = render(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('正在生成 Prompt 草案，请稍候。');

    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        hasConfirmedScope: true,
        hasParsedDocument: true,
        isGeneratingDrafts: false,
        statusMessage: null,
      }),
    );

    view.rerender(
      <MemoryRouter initialEntries={['/projects/42?stage=prompt']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('renders render stage when accepted drafts are ready for image generation', () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'render',
        hasConfirmedScope: true,
        hasParsedDocument: true,
        promptDrafts: [
          {
            id: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            status: 'accepted',
            promptText: '请生成整体架构图',
            generationStatus: 'completed',
            sourceSections: [{ index: 0, title: '1 Introduction' }],
          },
        ],
        renderAssets: [
          {
            id: 'asset-1',
            promptId: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            status: 'completed',
            rawStatus: 'completed',
            promptText: '请生成整体架构图',
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
        ],
        renderCompletedCount: 1,
      }),
    );

    render(
      <MemoryRouter initialEntries={['/projects/42?stage=render']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('本次默认参数')).toBeInTheDocument();
    expect(screen.getAllByText('整体架构图').length).toBeGreaterThan(0);
  });

  it('在 RenderStage 出现处理中资产时显示运行中 toast', async () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'render',
        hasConfirmedScope: true,
        hasParsedDocument: true,
        promptDrafts: [
          {
            id: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            status: 'accepted',
            promptText: '请生成整体架构图',
            generationStatus: 'completed',
            sourceSections: [{ index: 0, title: '1 Introduction' }],
          },
        ],
        renderAssets: [
          {
            id: 'asset-1',
            promptId: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            status: 'processing',
            rawStatus: 'processing',
            promptText: '请生成整体架构图',
            latestImageId: null,
            previewUrl: null,
            generationError: null,
            effectiveSettings: {
              resolution: '2K',
              aspectRatio: '16:9',
              colorScheme: 'okabe-ito',
            },
            overrideSettings: {},
          },
        ],
        tasks: [
          {
            id: 'render-running',
            type: '图片渲染',
            target: '1 张图片',
            status: 'running',
            detail: '后台正在生成图片，可在生成配图阶段查看进度。',
          },
        ],
      }),
    );

    render(
      <MemoryRouter initialEntries={['/projects/42?stage=render']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('后台正在生成图片，可在生成配图阶段查看进度。');
    expect(toast).toHaveTextContent('处理中');
  });

  it('renders review stage when completed images are ready for polish delivery', () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'review',
        hasConfirmedScope: true,
        hasParsedDocument: true,
        promptDrafts: [
          {
            id: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            status: 'accepted',
            promptText: '请生成整体架构图',
            generationStatus: 'completed',
            sourceSections: [{ index: 0, title: '1 Introduction' }],
          },
        ],
        renderAssets: [
          {
            id: 'asset-1',
            promptId: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            status: 'completed',
            rawStatus: 'completed',
            promptText: '请生成整体架构图',
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
        ],
        reviewAssets: [
          {
            id: 'draft-1',
            promptId: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            promptText: '请生成整体架构图',
            finalVersionId: null,
            versions: [
              {
                id: 'image-1',
                imageId: 'image-1',
                label: '原始生成',
                status: 'completed',
                createdAt: '2026-03-26T10:00:00Z',
                previewUrl: 'blob:preview-1',
                editInstruction: null,
                isPreviewLoading: false,
                isDownloading: false,
              },
            ],
          },
        ],
        renderCompletedCount: 1,
      }),
    );

    render(
      <MemoryRouter initialEntries={['/projects/42?stage=review']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: '整体架构图 预览' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '标记为最终稿' })).toBeInTheDocument();
  });

  it('shows prompt stage as blocked before scope confirmation', () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'scope',
        hasParsedDocument: true,
      }),
    );

    render(
      <MemoryRouter initialEntries={['/projects/42?stage=scope']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('尚未确认范围')).toBeInTheDocument();
    expect(screen.getByText('请先确认本次参考范围')).toBeInTheDocument();
  });

  it('wires scope confirm action from the page', async () => {
    const user = userEvent.setup();
    const handleConfirmScope = vi.fn();

    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'scope',
        hasParsedDocument: true,
        selectedSectionIndices: [0],
        handleConfirmScope,
        parsedDocument: {
          original_filename: 'paper.pdf',
        },
        parsedSections: [
          {
            title: '1 Introduction',
            content: 'Intro content',
          },
        ],
      }),
    );

    render(
      <MemoryRouter initialEntries={['/projects/42?stage=scope']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '确认范围并继续' }));

    expect(handleConfirmScope).toHaveBeenCalledTimes(1);
  });
});
