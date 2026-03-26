import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { render, screen } from '@/test/render';
import { ProjectStudioPage } from '@/pages/ProjectStudioPage';

const createStudioState = (overrides: Record<string, unknown> = {}) => ({
  currentProject: { name: '测试项目' },
  currentStage: 'ingest',
  documents: [],
  handleDownloadMarkdown: () => {},
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
  handleTriggerOcr: () => {},
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

  it('renders studio shell entry for /projects/:id', () => {
    render(
      <MemoryRouter initialEntries={['/projects/42']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Studio')).toBeInTheDocument();
  });

  it('renders prompt stage when prompt drafts are available', () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'prompt',
        hasParsedDocument: true,
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

    expect(screen.getByText('整体架构图')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '接受' })).toBeInTheDocument();
  });

  it('renders render stage when accepted drafts are ready for image generation', () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'render',
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
    expect(screen.getByText('整体架构图')).toBeInTheDocument();
  });

  it('renders review stage when completed images are ready for polish delivery', () => {
    mockUseProjectStudio.mockReturnValue(
      createStudioState({
        currentStage: 'review',
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
});
