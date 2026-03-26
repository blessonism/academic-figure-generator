import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { fetchAuthedBlob, triggerBrowserDownload } from '@/lib/blob';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';

import { STUDIO_STAGE_ORDER } from './constants';
import { getFirstAccessibleStage, getPresetSectionIndices } from './selectors';
import type {
  StudioColorSchemeOption,
  StudioDocumentItem,
  StudioHealthItem,
  StudioImagePricing,
  StudioPromptDraft,
  StudioPromptDraftReviewStatus,
  StudioPromptMode,
  StudioPromptSourceSection,
  StudioRenderAsset,
  StudioRenderParameters,
  StudioReviewAsset,
  StudioReviewVersion,
  StudioScopeMode,
  StudioScopePresetId,
  StudioStage,
  StudioStageSnapshot,
  StudioStatusMessage,
  StudioTaskItem,
} from './types';

function isStudioStage(value: string | null): value is StudioStage {
  return value !== null && STUDIO_STAGE_ORDER.includes(value as StudioStage);
}

interface ApiPromptDraft {
  id: string;
  title?: string | null;
  figure_number?: number | null;
  original_prompt?: string | null;
  edited_prompt?: string | null;
  active_prompt?: string | null;
  suggested_figure_type?: string | null;
  suggested_aspect_ratio?: string | null;
  source_sections?: unknown;
  generation_status?: string | null;
}

interface ApiProjectImage {
  id: string;
  prompt_id?: string | null;
  resolution?: string | null;
  aspect_ratio?: string | null;
  color_scheme?: string | null;
  generation_status?: string | null;
  generation_error?: string | null;
  edit_instruction?: string | null;
  retry_count?: number | null;
  created_at?: string | null;
}

interface ApiImagePricing {
  price_cny_default?: number | null;
  price_cny_1k?: number | null;
  price_cny_2k?: number | null;
  price_cny_4k?: number | null;
}

interface ApiColorSchemeOption {
  id?: string | null;
  name?: string | null;
  display_name?: string | null;
}

function normalizeRenderParameters(
  value?: Partial<StudioRenderParameters> | null,
): Partial<StudioRenderParameters> {
  return {
    resolution: value?.resolution || undefined,
    aspectRatio: value?.aspectRatio || undefined,
    colorScheme: value?.colorScheme || undefined,
  };
}

function getRenderAssetStatus(rawStatus?: string | null): StudioRenderAsset['status'] {
  if (rawStatus === 'completed') {
    return 'completed';
  }

  if (rawStatus === 'failed') {
    return 'failed';
  }

  if (rawStatus === 'processing' || rawStatus === 'pending') {
    return 'processing';
  }

  return 'idle';
}

function getEffectiveRenderParameters(input: {
  projectDefaults: StudioRenderParameters;
  sessionDefaults: StudioRenderParameters;
  overrides?: Partial<StudioRenderParameters> | null;
}): StudioRenderParameters {
  const overrides = normalizeRenderParameters(input.overrides);

  return {
    resolution: overrides.resolution || input.sessionDefaults.resolution || input.projectDefaults.resolution,
    aspectRatio: overrides.aspectRatio || input.sessionDefaults.aspectRatio || input.projectDefaults.aspectRatio,
    colorScheme: overrides.colorScheme || input.sessionDefaults.colorScheme || input.projectDefaults.colorScheme,
  };
}

function normalizeImagePricing(payload: ApiImagePricing | null | undefined): StudioImagePricing | null {
  if (!payload) {
    return null;
  }

  return {
    priceCnyDefault: payload.price_cny_default ?? 0,
    priceCny1K: payload.price_cny_1k ?? payload.price_cny_default ?? 0,
    priceCny2K: payload.price_cny_2k ?? payload.price_cny_default ?? 0,
    priceCny4K: payload.price_cny_4k ?? payload.price_cny_default ?? 0,
  };
}

function normalizeColorSchemeOptions(
  payload: ApiColorSchemeOption[] | null | undefined,
): StudioColorSchemeOption[] {
  return (payload ?? [])
    .map((item) => {
      const value = item.name?.trim();
      if (!value) {
        return null;
      }

      return {
        value,
        label: item.display_name?.trim() || value,
      };
    })
    .filter((item): item is StudioColorSchemeOption => item !== null);
}

function normalizePromptSourceSections(sourceSections: unknown): StudioPromptSourceSection[] {
  if (Array.isArray(sourceSections)) {
    return sourceSections.map((section, index) => {
      if (typeof section === 'string') {
        return {
          index,
          title: section,
        };
      }

      if (section && typeof section === 'object') {
        const record = section as Record<string, unknown>;
        const sectionIndex = typeof record.index === 'number' ? record.index : index;
        const title =
          typeof record.title === 'string'
            ? record.title
            : typeof record.section_title === 'string'
              ? record.section_title
              : `章节 ${sectionIndex + 1}`;

        return {
          index: sectionIndex,
          title,
        };
      }

      return {
        index,
        title: `章节 ${index + 1}`,
      };
    });
  }

  if (sourceSections && typeof sourceSections === 'object') {
    const record = sourceSections as Record<string, unknown>;

    if (Array.isArray(record.sections)) {
      return normalizePromptSourceSections(record.sections);
    }

    return Object.entries(record).map(([key, value], index) => ({
      index,
      title: typeof value === 'string' ? value : key,
    }));
  }

  return [];
}

function normalizePromptDraft(
  draft: ApiPromptDraft,
  reviewStatus: StudioPromptDraftReviewStatus,
): StudioPromptDraft {
  return {
    id: String(draft.id),
    title: draft.title?.trim() || `Figure ${draft.figure_number ?? ''}`.trim(),
    figureNumber: draft.figure_number ?? null,
    figureType: draft.suggested_figure_type || '未分类',
    status: reviewStatus,
    promptText: draft.edited_prompt ?? draft.active_prompt ?? draft.original_prompt ?? '',
    generationStatus: draft.generation_status || 'pending',
    suggestedAspectRatio: draft.suggested_aspect_ratio ?? null,
    sourceSections: normalizePromptSourceSections(draft.source_sections),
  };
}

function canAccessStage(stage: StudioStage, snapshot: StudioStageSnapshot): boolean {
  if (stage === 'ingest') {
    return true;
  }

  if (stage === 'scope') {
    return snapshot.hasParsedDocument;
  }

  if (stage === 'prompt') {
    return Boolean(snapshot.hasConfirmedScope);
  }

  if (stage === 'render') {
    return Boolean(snapshot.hasAcceptedDraft);
  }

  return Boolean(snapshot.hasRenderedAsset);
}

export function useProjectStudio() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedStage = searchParams.get('stage');
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const { currentProject, setCurrentProject } = useProjectStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [documents, setDocuments] = useState<StudioDocumentItem[]>([]);
  const [promptDrafts, setPromptDrafts] = useState<StudioPromptDraft[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ocrLoading, setOcrLoading] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<StudioStatusMessage | null>(null);
  const [scopeMode, setScopeMode] = useState<StudioScopeMode>('preset');
  const [selectedScopePresetId, setSelectedScopePresetId] =
    useState<StudioScopePresetId>('full-paper');
  const [selectedSectionIndices, setSelectedSectionIndices] = useState<number[]>([]);
  const [promptMode, setPromptMode] = useState<StudioPromptMode>('overall');
  const [promptRequest, setPromptRequest] = useState('');
  const [templateMode, setTemplateMode] = useState(false);
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false);
  const [savingPromptIds, setSavingPromptIds] = useState<Record<string, boolean>>({});
  const [images, setImages] = useState<ApiProjectImage[]>([]);
  const [renderColorSchemeOptions, setRenderColorSchemeOptions] = useState<StudioColorSchemeOption[]>([]);
  const [renderImagePricing, setRenderImagePricing] = useState<StudioImagePricing | null>(null);
  const [renderSessionDefaults, setRenderSessionDefaults] = useState<StudioRenderParameters>({
    resolution: '2K',
    aspectRatio: '16:9',
    colorScheme: 'okabe-ito',
  });
  const [renderAssetOverrides, setRenderAssetOverrides] = useState<
    Record<string, Partial<StudioRenderParameters>>
  >({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});
  const [downloadingImageId, setDownloadingImageId] = useState<string | null>(null);
  const [reviewEditingImageIds, setReviewEditingImageIds] = useState<Record<string, boolean>>({});
  const [reviewFinalVersionIds, setReviewFinalVersionIds] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const renderDefaultsKeyRef = useRef<string | null>(null);

  const applyPromptDrafts = useCallback((nextPromptDrafts: ApiPromptDraft[]) => {
    setPromptDrafts((previous) => {
      const reviewStatusById = new Map(previous.map((draft) => [draft.id, draft.status]));

      return nextPromptDrafts.map((draft) =>
        normalizePromptDraft(draft, reviewStatusById.get(String(draft.id)) ?? 'pending'),
      );
    });
  }, []);

  const fetchProjectData = useCallback(
    async (projectId: string, opts?: { showLoader?: boolean }) => {
      const showLoader = opts?.showLoader ?? false;

      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const [projectResponse, documentsResponse] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/documents`),
        ]);

        setCurrentProject(projectResponse.data);
        setDocuments(documentsResponse.data || []);

        try {
          const promptsResponse = await api.get(`/projects/${projectId}/prompts`);
          applyPromptDrafts(promptsResponse.data || []);
        } catch {
          setPromptDrafts([]);
        }

        try {
          const imagesResponse = await api.get(`/projects/${projectId}/images`);
          setImages(imagesResponse.data || []);
        } catch {
          setImages([]);
        }

        try {
          const colorSchemesResponse = await api.get('/color-schemes/');
          setRenderColorSchemeOptions(normalizeColorSchemeOptions(colorSchemesResponse.data));
        } catch {
          setRenderColorSchemeOptions([]);
        }

        try {
          const pricingResponse = await api.get('/images/pricing');
          setRenderImagePricing(normalizeImagePricing(pricingResponse.data));
        } catch {
          setRenderImagePricing(null);
        }
      } catch (error) {
        setDocuments([]);
        setPromptDrafts([]);
        setImages([]);
        setRenderColorSchemeOptions([]);
        setRenderImagePricing(null);
        setStatusMessage({
          status: 'failed',
          detail: getApiErrorMessage(error, '项目数据加载失败，请稍后刷新重试。'),
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [applyPromptDrafts, setCurrentProject],
  );

  useEffect(() => {
    if (!id || !token) {
      setIsLoading(false);
      return;
    }

    void fetchProjectData(id, { showLoader: true });

    return () => {
      setCurrentProject(null);
    };
  }, [fetchProjectData, id, setCurrentProject, token]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const hasParsing = documents.some(
      (document) => document.parse_status === 'parsing' || document.parse_status === 'pending',
    );

    if (!hasParsing) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchProjectData(id, { showLoader: false });
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [documents, fetchProjectData, id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const hasRendering = images.some((image) =>
      image.generation_status === 'processing' || image.generation_status === 'pending',
    );

    if (!hasRendering) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchProjectData(id, { showLoader: false });
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchProjectData, id, images]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // 忽略已回收对象 URL 的异常。
        }
      });
      previewUrlsRef.current = {};
    };
  }, []);

  const parsedDocument = useMemo(
    () =>
      documents.find(
        (document) =>
          document.parse_status === 'completed' &&
          Array.isArray(document.sections) &&
          document.sections.length > 0,
      ) ?? null,
    [documents],
  );

  const parsedSections = useMemo(() => parsedDocument?.sections ?? [], [parsedDocument]);
  const hasParsedDocument = parsedSections.length > 0;
  const hasPromptDrafts = promptDrafts.length > 0;
  const hasAcceptedDraft = promptDrafts.some((draft) => draft.status === 'accepted');

  useEffect(() => {
    if (!hasParsedDocument) {
      setSelectedSectionIndices([]);
      return;
    }

    if (scopeMode === 'preset' && selectedScopePresetId !== 'custom') {
      setSelectedSectionIndices(
        getPresetSectionIndices({
          presetId: selectedScopePresetId,
          sections: parsedSections,
        }),
      );
      return;
    }

    setSelectedSectionIndices((previous) =>
      previous.filter((index) => index >= 0 && index < parsedSections.length),
    );
  }, [hasParsedDocument, parsedSections, scopeMode, selectedScopePresetId]);

  const hasOcrConfig = Boolean(user?.paddleocr_api_key_set && user?.paddleocr_server_url);
  const hasPromptConfig = Boolean(user?.prompt_ai_provider && user?.prompt_ai_api_key_set);
  const hasImageConfig = Boolean(user?.nanobanana_api_key_set);
  const renderProjectDefaults = useMemo<StudioRenderParameters>(
    () => ({
      resolution: user?.default_resolution || '2K',
      aspectRatio: user?.default_aspect_ratio || '16:9',
      colorScheme: currentProject?.color_scheme || user?.default_color_scheme || 'okabe-ito',
    }),
    [
      currentProject?.color_scheme,
      user?.default_aspect_ratio,
      user?.default_color_scheme,
      user?.default_resolution,
    ],
  );

  useEffect(() => {
    const nextDefaultsKey = [
      id ?? 'unknown',
      renderProjectDefaults.resolution,
      renderProjectDefaults.aspectRatio,
      renderProjectDefaults.colorScheme,
    ].join(':');

    if (renderDefaultsKeyRef.current === nextDefaultsKey) {
      return;
    }

    setRenderSessionDefaults(renderProjectDefaults);
    renderDefaultsKeyRef.current = nextDefaultsKey;
  }, [id, renderProjectDefaults]);

  const renderAssets = useMemo<StudioRenderAsset[]>(() => {
    const latestImageByPromptId = new Map<string, ApiProjectImage>();

    images.forEach((image) => {
      const promptId = image.prompt_id;
      if (!promptId) {
        return;
      }

      const previousImage = latestImageByPromptId.get(promptId);
      if (!previousImage) {
        latestImageByPromptId.set(promptId, image);
        return;
      }

      const previousCreatedAt = new Date(previousImage.created_at || 0).getTime();
      const nextCreatedAt = new Date(image.created_at || 0).getTime();

      if (nextCreatedAt >= previousCreatedAt) {
        latestImageByPromptId.set(promptId, image);
      }
    });

    return promptDrafts
      .filter((draft) => draft.status === 'accepted')
      .map((draft) => {
        const latestImage = latestImageByPromptId.get(draft.id);
        const overrideSettings = normalizeRenderParameters(renderAssetOverrides[draft.id]);
        const effectiveSettings = getEffectiveRenderParameters({
          projectDefaults: renderProjectDefaults,
          sessionDefaults: renderSessionDefaults,
          overrides: overrideSettings,
        });

        return {
          id: draft.id,
          promptId: draft.id,
          title: draft.title,
          figureType: draft.figureType,
          status: getRenderAssetStatus(latestImage?.generation_status),
          rawStatus: latestImage?.generation_status || 'pending',
          promptText: draft.promptText,
          latestImageId: latestImage?.id ?? null,
          previewUrl: latestImage ? previewUrls[latestImage.id] ?? null : null,
          generationError: latestImage?.generation_error ?? null,
          effectiveSettings,
          overrideSettings,
          suggestedAspectRatio: draft.suggestedAspectRatio,
          isPreviewLoading: latestImage ? Boolean(previewLoading[latestImage.id]) : false,
          isDownloading: latestImage ? downloadingImageId === latestImage.id : false,
        };
      });
  }, [
    downloadingImageId,
    images,
    previewLoading,
    previewUrls,
    promptDrafts,
    renderAssetOverrides,
    renderProjectDefaults,
    renderSessionDefaults,
  ]);

  const reviewAssets = useMemo<StudioReviewAsset[]>(() => {
    const promptById = new Map(promptDrafts.map((draft) => [draft.id, draft]));
    const imagesByPromptId = new Map<string, ApiProjectImage[]>();

    images.forEach((image) => {
      if (!image.prompt_id) {
        return;
      }

      const bucket = imagesByPromptId.get(image.prompt_id) ?? [];
      bucket.push(image);
      imagesByPromptId.set(image.prompt_id, bucket);
    });

    return Array.from(imagesByPromptId.entries())
      .map(([promptId, promptImages], groupIndex) => {
        const sortedImages = [...promptImages].sort((left, right) => {
          const leftTime = new Date(left.created_at || 0).getTime();
          const rightTime = new Date(right.created_at || 0).getTime();
          return rightTime - leftTime;
        });

        const versions: StudioReviewVersion[] = sortedImages.map((image, index) => {
          const versionNumber = sortedImages.length - index - 1;
          return {
            id: image.id,
            imageId: image.id,
            label: versionNumber === 0 ? '原始生成' : `精修 ${versionNumber}`,
            status: getRenderAssetStatus(image.generation_status),
            createdAt: image.created_at ?? null,
            previewUrl: previewUrls[image.id] ?? null,
            generationError: image.generation_error ?? null,
            editInstruction: image.edit_instruction ?? null,
            resolution: image.resolution || '2K',
            aspectRatio: image.aspect_ratio || '16:9',
            colorScheme: image.color_scheme ?? null,
            isPreviewLoading: Boolean(previewLoading[image.id]),
            isDownloading: downloadingImageId === image.id,
            isEditing: Boolean(reviewEditingImageIds[image.id]),
          };
        });

        if (!versions.some((version) => version.status === 'completed')) {
          return null;
        }

        const promptDraft = promptById.get(promptId);
        const finalVersionId = reviewFinalVersionIds[promptId];

        return {
          id: promptId,
          promptId,
          title: promptDraft?.title || `结果 ${groupIndex + 1}`,
          figureType: promptDraft?.figureType || '未分类',
          promptText: promptDraft?.promptText || '',
          finalVersionId: versions.some((version) => version.imageId === finalVersionId)
            ? finalVersionId
            : null,
          versions,
        };
      })
      .filter((asset): asset is StudioReviewAsset => asset !== null)
      .sort((left, right) => {
        const leftTime = new Date(left.versions[0]?.createdAt || 0).getTime();
        const rightTime = new Date(right.versions[0]?.createdAt || 0).getTime();
        return rightTime - leftTime;
      });
  }, [
    downloadingImageId,
    images,
    previewLoading,
    previewUrls,
    promptDrafts,
    reviewEditingImageIds,
    reviewFinalVersionIds,
  ]);

  const hasRenderedAsset = reviewAssets.length > 0;

  const stageSnapshot = useMemo<StudioStageSnapshot>(
    () => ({
      hasParsedDocument,
      hasConfirmedScope: hasPromptDrafts,
      hasAcceptedDraft,
      hasRenderedAsset,
    }),
    [hasAcceptedDraft, hasParsedDocument, hasPromptDrafts, hasRenderedAsset],
  );

  const defaultStage: StudioStage = hasRenderedAsset
    ? 'review'
    : hasAcceptedDraft
      ? 'render'
      : hasPromptDrafts
        ? 'prompt'
        : getFirstAccessibleStage({ hasParsedDocument });

  const currentStage =
    isStudioStage(requestedStage) && canAccessStage(requestedStage, stageSnapshot)
      ? requestedStage
      : defaultStage;

  const healthItems = useMemo<StudioHealthItem[]>(() => {
    return [
      {
        id: 'ocr',
        label: 'OCR 能力',
        status: hasOcrConfig ? 'ready' : 'warning',
        description: hasOcrConfig
          ? 'PaddleOCR 已配置，可对 PDF 触发 OCR 重解析并下载 Markdown。'
          : '请先完成能力配置：当前缺少 PaddleOCR Server URL 或 Token。',
      },
      {
        id: 'documents',
        label: '文档解析',
        status: hasParsedDocument ? 'ready' : 'warning',
        description: hasParsedDocument
          ? '至少已有一篇论文解析完成，可以进入下一阶段确认范围。'
          : documents.length > 0
            ? '文档已进入队列，等待解析完成后即可解锁范围确认。'
            : '请先上传论文文档，Studio 才能生成结构化章节。',
      },
      {
        id: 'prompt-ai',
        label: 'Prompt AI',
        status: hasPromptConfig ? 'ready' : 'warning',
        description: hasPromptConfig
          ? 'Prompt AI 已配置，可以生成可审核的配图草案。'
          : '请先完成 Prompt AI 配置，否则无法进入草案生成阶段。',
      },
      {
        id: 'image-ai',
        label: '出图能力',
        status: hasImageConfig ? 'ready' : 'warning',
        description: hasImageConfig
          ? '图片生成能力已配置，可以在 RenderStage 中发起正式渲染。'
          : '请先完成图片生成能力配置，否则无法开始正式出图。',
      },
    ];
  }, [documents.length, hasImageConfig, hasOcrConfig, hasParsedDocument, hasPromptConfig]);

  const tasks = useMemo<StudioTaskItem[]>(() => {
    const nextTasks: StudioTaskItem[] = [];

    if (isUploading) {
      nextTasks.push({
        id: 'upload',
        type: '文件上传',
        target: '准备论文',
        status: 'running',
        detail: `文档上传中，当前进度 ${uploadProgress}%。`,
      });
    }

    const parsingDocuments = documents.filter(
      (document) => document.parse_status === 'parsing' || document.parse_status === 'pending',
    );
    if (parsingDocuments.length > 0) {
      nextTasks.push({
        id: 'parse',
        type: '文档解析',
        target: parsingDocuments.map((document) => document.original_filename).join('、'),
        status: 'running',
        detail: '后台正在提取正文和章节结构，请稍候。',
      });
    }

    documents
      .filter((document) => document.parse_status === 'failed')
      .forEach((document) => {
        nextTasks.push({
          id: `failed-${document.id}`,
          type: '解析失败',
          target: document.original_filename,
          status: 'failed',
          detail: document.parse_error || '解析失败，请重新上传或检查后端服务。',
        });
      });

    documents
      .filter((document) => document.ocr_markdown)
      .forEach((document) => {
        nextTasks.push({
          id: `ocr-${document.id}`,
          type: 'OCR 结果',
          target: document.original_filename,
          status: 'completed',
          detail: 'OCR Markdown 已生成，可下载复核。',
        });
      });

    if (isGeneratingDrafts) {
      nextTasks.push({
        id: 'prompt-generation',
        type: '草案生成',
        target: '生成草案',
        status: 'running',
        detail: '正在调用 Prompt AI 生成配图草案，请稍候。',
      });
    }

    const pendingDraftCount = promptDrafts.filter((draft) => draft.status === 'pending').length;
    if (pendingDraftCount > 0) {
      nextTasks.push({
        id: 'draft-review',
        type: '草案待确认',
        target: `${pendingDraftCount} 条草案`,
        status: 'running',
        detail: '请先接受或跳过草案，再继续进入配图生成阶段。',
      });
    }

    const acceptedDraftCount = promptDrafts.filter((draft) => draft.status === 'accepted').length;
    if (acceptedDraftCount > 0) {
      nextTasks.push({
        id: 'draft-accepted',
        type: '已接受草案',
        target: `${acceptedDraftCount} 条草案`,
        status: 'completed',
        detail: '草案已确认，后续可以继续迁移到生成配图阶段。',
      });
    }

    const renderingCount = renderAssets.filter((asset) => asset.status === 'processing').length;
    if (renderingCount > 0) {
      nextTasks.push({
        id: 'render-running',
        type: '图片渲染',
        target: `${renderingCount} 张图片`,
        status: 'running',
        detail: '后台正在生成图片，可在生成配图阶段查看进度。',
      });
    }

    const failedRenderCount = renderAssets.filter((asset) => asset.status === 'failed').length;
    if (failedRenderCount > 0) {
      nextTasks.push({
        id: 'render-failed',
        type: '渲染失败',
        target: `${failedRenderCount} 张图片`,
        status: 'failed',
        detail: '部分图片生成失败，建议调整参数后单项重试。',
      });
    }

    const completedRenderCount = renderAssets.filter((asset) => asset.status === 'completed').length;
    if (completedRenderCount > 0) {
      nextTasks.push({
        id: 'render-completed',
        type: '已完成结果',
        target: `${completedRenderCount} 张图片`,
        status: 'completed',
        detail: '已生成的图片可以继续预览、下载，后续再迁入精修交付阶段。',
      });
    }

    if (nextTasks.length === 0) {
      nextTasks.push({
        id: 'ingest-default',
        type: hasParsedDocument ? '准备完成' : '准备论文',
        target: hasParsedDocument ? '已具备进入下一阶段的基础数据' : '上传并解析第一篇论文',
        status: hasParsedDocument ? 'completed' : 'running',
        detail: hasParsedDocument
          ? '可以切换到确认范围阶段。'
          : '当前还没有可用的解析结果。',
      });
    }

    return nextTasks;
  }, [
    documents,
    hasParsedDocument,
    isGeneratingDrafts,
    isUploading,
    promptDrafts,
    renderAssets,
    uploadProgress,
  ]);

  const handleScopeModeChange = useCallback((nextMode: StudioScopeMode) => {
    setScopeMode(nextMode);
    setSelectedScopePresetId((previous) => {
      if (nextMode === 'custom') {
        return 'custom';
      }

      return previous === 'custom' ? 'full-paper' : previous;
    });
  }, []);

  const handleScopePresetSelect = useCallback((presetId: StudioScopePresetId) => {
    setSelectedScopePresetId(presetId);
    setScopeMode(presetId === 'custom' ? 'custom' : 'preset');
  }, []);

  const handleSelectedSectionIndicesChange = useCallback((indices: number[]) => {
    setSelectedSectionIndices(Array.from(new Set(indices)).sort((left, right) => left - right));
  }, []);

  const handlePromptModeChange = useCallback((nextMode: StudioPromptMode) => {
    setPromptMode(nextMode);
  }, []);

  const handlePromptRequestChange = useCallback((nextRequest: string) => {
    setPromptRequest(nextRequest);
  }, []);

  const handleTemplateModeChange = useCallback((enabled: boolean) => {
    setTemplateMode(enabled);
  }, []);

  const handleDraftStatusChange = useCallback(
    (draftId: string, nextStatus: StudioPromptDraftReviewStatus) => {
      setPromptDrafts((previous) =>
        previous.map((draft) =>
          draft.id === draftId
            ? {
                ...draft,
                status: nextStatus,
              }
            : draft,
        ),
      );
    },
    [],
  );

  const handleDraftPromptChange = useCallback((draftId: string, nextPromptText: string) => {
    setPromptDrafts((previous) =>
      previous.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              promptText: nextPromptText,
            }
          : draft,
      ),
    );
  }, []);

  const handleGeneratePromptDrafts = useCallback(async () => {
    if (!id) {
      return;
    }

    if (!hasParsedDocument) {
      setStatusMessage({
        status: 'failed',
        detail: '请先完成文档解析，再生成配图草案。',
      });
      return;
    }

    if (!hasPromptConfig) {
      setStatusMessage({
        status: 'failed',
        detail: '请先完成 Prompt AI 配置，再生成配图草案。',
      });
      return;
    }

    if (promptMode === 'sections' && selectedSectionIndices.length === 0) {
      setStatusMessage({
        status: 'failed',
        detail: '当前已切到按章节生成，请至少选择一个章节后再继续。',
      });
      return;
    }

    setIsGeneratingDrafts(true);
    setStatusMessage({
      status: 'running',
      detail: '正在生成 Prompt 草案，请稍候。',
    });

    try {
      const beforeCount = promptDrafts.length;
      await api.post(`/projects/${id}/prompts/generate`, {
        section_indices: selectedSectionIndices.length > 0 ? selectedSectionIndices : null,
        color_scheme: currentProject?.color_scheme || 'okabe-ito',
        figure_types: promptMode === 'overall' ? ['overall_framework'] : null,
        user_request: templateMode ? null : promptRequest.trim() || null,
        max_figures: promptMode === 'overall' ? 1 : null,
        template_mode: templateMode,
      });

      let nextPrompts: ApiPromptDraft[] = [];
      const deadline = Date.now() + 90_000;

      while (Date.now() < deadline) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        const promptsResponse = await api.get(`/projects/${id}/prompts`);
        nextPrompts = promptsResponse.data || [];
        applyPromptDrafts(nextPrompts);

        if (nextPrompts.length > beforeCount) {
          break;
        }
      }

      await fetchProjectData(id, { showLoader: false });

      const createdDraftCount = Math.max(0, nextPrompts.length - beforeCount);
      setStatusMessage({
        status: 'completed',
        detail:
          createdDraftCount > 0
            ? `已生成 ${createdDraftCount} 条草案，请先确认后再继续出图。`
            : '草案任务已提交，如果后台较慢可稍后回到本页继续查看。',
      });
    } catch (error) {
      setStatusMessage({
        status: 'failed',
        detail: `草案生成失败：${getApiErrorMessage(error, '请检查 Prompt AI 配置或稍后重试。')}`,
      });
    } finally {
      setIsGeneratingDrafts(false);
    }
  }, [
    applyPromptDrafts,
    currentProject?.color_scheme,
    fetchProjectData,
    hasParsedDocument,
    hasPromptConfig,
    id,
    promptDrafts.length,
    promptMode,
    promptRequest,
    selectedSectionIndices,
    templateMode,
  ]);

  const handleSaveDraftPrompt = useCallback(
    async (draftId: string) => {
      const targetDraft = promptDrafts.find((draft) => draft.id === draftId);
      if (!targetDraft || !targetDraft.promptText.trim()) {
        return;
      }

      setSavingPromptIds((previous) => ({ ...previous, [draftId]: true }));

      try {
        const response = await api.put(`/prompts/${draftId}`, {
          edited_prompt: targetDraft.promptText,
        });

        setPromptDrafts((previous) =>
          previous.map((draft) =>
            draft.id === draftId
              ? normalizePromptDraft(response.data as ApiPromptDraft, draft.status)
              : draft,
          ),
        );

        setStatusMessage({
          status: 'completed',
          detail: `${targetDraft.title} 已更新，可继续决定接受或跳过。`,
        });
      } catch (error) {
        setStatusMessage({
          status: 'failed',
          detail: `草案保存失败：${getApiErrorMessage(error, '请稍后重试。')}`,
        });
      } finally {
        setSavingPromptIds((previous) => ({ ...previous, [draftId]: false }));
      }
    },
    [promptDrafts],
  );

  const handleRenderSessionDefaultsChange = useCallback(
    (field: keyof StudioRenderParameters, value: string) => {
      setRenderSessionDefaults((previous) => ({
        ...previous,
        [field]: value,
      }));
    },
    [],
  );

  const handleRenderAssetOverrideChange = useCallback(
    (promptId: string, field: keyof StudioRenderParameters, value: string) => {
      setRenderAssetOverrides((previous) => ({
        ...previous,
        [promptId]: {
          ...normalizeRenderParameters(previous[promptId]),
          [field]: value,
        },
      }));
    },
    [],
  );

  const handleResetRenderAssetOverrides = useCallback((promptId: string) => {
    setRenderAssetOverrides((previous) => {
      const next = { ...previous };
      delete next[promptId];
      return next;
    });
  }, []);

  const handleGenerateRenderAsset = useCallback(
    async (promptId: string) => {
      if (!id) {
        return;
      }

      if (!hasImageConfig) {
        setStatusMessage({
          status: 'failed',
          detail: '请先完成图片生成能力配置，再开始正式出图。',
        });
        return;
      }

      const targetDraft = promptDrafts.find((draft) => draft.id === promptId);
      if (!targetDraft) {
        return;
      }

      const effectiveSettings = getEffectiveRenderParameters({
        projectDefaults: renderProjectDefaults,
        sessionDefaults: renderSessionDefaults,
        overrides: renderAssetOverrides[promptId],
      });

      setStatusMessage({
        status: 'running',
        detail: `正在生成 ${targetDraft.title}，请稍候。`,
      });

      try {
        await api.post(`/prompts/${promptId}/images/generate`, {
          resolution: effectiveSettings.resolution,
          aspect_ratio: effectiveSettings.aspectRatio,
          color_scheme: effectiveSettings.colorScheme,
        });

        await fetchProjectData(id, { showLoader: false });
        setStatusMessage({
          status: 'completed',
          detail: `${targetDraft.title} 的渲染任务已提交，可继续查看生成状态。`,
        });
      } catch (error) {
        const detail = getApiErrorMessage(error, '请稍后重试。');
        setStatusMessage({
          status: 'failed',
          detail: `图片生成失败：${detail}`,
        });
      }
    },
    [
      fetchProjectData,
      hasImageConfig,
      id,
      promptDrafts,
      renderAssetOverrides,
      renderProjectDefaults,
      renderSessionDefaults,
    ],
  );

  const handleRenderAssetPreview = useCallback(async (imageId: string) => {
    if (previewUrls[imageId] || previewLoading[imageId]) {
      return;
    }

    setPreviewLoading((previous) => ({ ...previous, [imageId]: true }));

    try {
      const { blob } = await fetchAuthedBlob(`/images/${imageId}/download`);
      const objectUrl = URL.createObjectURL(blob);
      const previousUrl = previewUrlsRef.current[imageId];

      if (previousUrl) {
        try {
          URL.revokeObjectURL(previousUrl);
        } catch {
          // 忽略旧 URL 已被回收的情况。
        }
      }

      previewUrlsRef.current[imageId] = objectUrl;
      setPreviewUrls((previous) => ({
        ...previous,
        [imageId]: objectUrl,
      }));
    } catch (error) {
      setStatusMessage({
        status: 'failed',
        detail: `图片预览加载失败：${getApiErrorMessage(error, '请稍后重试。')}`,
      });
    } finally {
      setPreviewLoading((previous) => ({ ...previous, [imageId]: false }));
    }
  }, [previewLoading, previewUrls]);

  const handleRenderAssetDownload = useCallback(async (imageId: string) => {
    setDownloadingImageId(imageId);

    try {
      const { blob, ext } = await fetchAuthedBlob(`/images/${imageId}/download`);
      triggerBrowserDownload(blob, `academic-figure-${imageId}.${ext}`);
    } catch (error) {
      setStatusMessage({
        status: 'failed',
        detail: `图片下载失败：${getApiErrorMessage(error, '请稍后重试。')}`,
      });
    } finally {
      setDownloadingImageId(null);
    }
  }, []);

  const handleReviewAssetEdit = useCallback(
    async (imageId: string, instruction: string) => {
      if (!id) {
        return;
      }

      const nextInstruction = instruction.trim();
      if (!nextInstruction) {
        return;
      }

      const targetImage = images.find((image) => image.id === imageId);
      const targetDraft = targetImage?.prompt_id
        ? promptDrafts.find((draft) => draft.id === targetImage.prompt_id)
        : null;
      const targetLabel = targetDraft?.title || `图片 ${imageId}`;

      setReviewEditingImageIds((previous) => ({ ...previous, [imageId]: true }));
      setStatusMessage({
        status: 'running',
        detail: `正在提交 ${targetLabel} 的精修任务。`,
      });

      try {
        const formData = new FormData();
        formData.append('edit_instruction', nextInstruction);
        await api.post(`/images/${imageId}/edit`, formData);

        await fetchProjectData(id, { showLoader: false });
        setStatusMessage({
          status: 'completed',
          detail: `${targetLabel} 的精修任务已提交，可在版本历史中继续查看。`,
        });
      } catch (error) {
        setStatusMessage({
          status: 'failed',
          detail: `精修提交失败：${getApiErrorMessage(error, '请稍后重试。')}`,
        });
      } finally {
        setReviewEditingImageIds((previous) => ({ ...previous, [imageId]: false }));
      }
    },
    [fetchProjectData, id, images, promptDrafts],
  );

  const handleReviewAssetMarkFinal = useCallback((promptId: string, imageId: string) => {
    setReviewFinalVersionIds((previous) => ({
      ...previous,
      [promptId]: imageId,
    }));
    setStatusMessage({
      status: 'completed',
      detail: '当前版本已标记为最终稿。该状态暂时只保存在本地会话中。',
    });
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !id) {
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setStatusMessage({
        status: 'running',
        detail: `正在上传 ${file.name}。`,
      });

      const formData = new FormData();
      formData.append('file', file);

      try {
        await api.post(`/projects/${id}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 0;
            if (!total) {
              return;
            }

            setUploadProgress(Math.min(100, Math.round((progressEvent.loaded / total) * 100)));
          },
        });

        await fetchProjectData(id);
        setStatusMessage({
          status: 'completed',
          detail: '文件上传成功，已加入解析队列。',
        });
      } catch (error) {
        const detail = getApiErrorMessage(error, '文件上传失败，请检查后端/存储服务是否正常。');
        setStatusMessage({
          status: 'failed',
          detail: `文件上传失败：${detail}`,
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        event.target.value = '';
      }
    },
    [fetchProjectData, id],
  );

  const handleTriggerOcr = useCallback(
    async (document: StudioDocumentItem) => {
      if (!id || ocrLoading[document.id]) {
        return;
      }

      setOcrLoading((previous) => ({ ...previous, [document.id]: true }));
      setStatusMessage({
        status: 'running',
        detail: `正在触发 ${document.original_filename} 的 OCR 解析。`,
      });

      try {
        await api.post(`/projects/${id}/documents/${document.id}/ocr`);

        const deadline = Date.now() + 300_000;
        while (Date.now() < deadline) {
          await new Promise((resolve) => window.setTimeout(resolve, 3000));

          const documentsResponse = await api.get(`/projects/${id}/documents`);
          const nextDocuments = documentsResponse.data || [];
          const updatedDocument = nextDocuments.find(
            (candidate: StudioDocumentItem) => candidate.id === document.id,
          );

          setDocuments(nextDocuments);

          if (
            updatedDocument &&
            updatedDocument.parse_status !== 'parsing' &&
            updatedDocument.parse_status !== 'pending'
          ) {
            break;
          }
        }

        await fetchProjectData(id, { showLoader: false });
        setStatusMessage({
          status: 'completed',
          detail: `${document.original_filename} 的 OCR 状态已刷新。`,
        });
      } catch (error) {
        setStatusMessage({
          status: 'failed',
          detail: `OCR 解析触发失败：${getApiErrorMessage(error, '请检查 PaddleOCR 配置。')}`,
        });
      } finally {
        setOcrLoading((previous) => ({ ...previous, [document.id]: false }));
      }
    },
    [fetchProjectData, id, ocrLoading],
  );

  const handleDownloadMarkdown = useCallback((fileDocument: StudioDocumentItem) => {
    if (!fileDocument.ocr_markdown) {
      return;
    }

    const blob = new Blob([fileDocument.ocr_markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileDocument.original_filename.replace(/\.[^/.]+$/, '') + '_ocr.md';
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    projectId: id ?? null,
    currentProject,
    currentStage,
    isLoading,
    isRefreshing,
    documents,
    promptDrafts,
    parsedDocument,
    parsedSections,
    hasParsedDocument,
    hasOcrConfig,
    healthItems,
    tasks,
    isUploading,
    uploadProgress,
    ocrLoading,
    statusMessage,
    scopeMode,
    selectedScopePresetId,
    selectedSectionIndices,
    promptMode,
    promptRequest,
    templateMode,
    isGeneratingDrafts,
    savingPromptIds,
    renderProjectDefaults,
    renderSessionDefaults,
    renderColorSchemeOptions,
    renderImagePricing,
    renderAssets,
    reviewAssets,
    handleFileChange,
    handleTriggerOcr,
    handleDownloadMarkdown,
    handleScopeModeChange,
    handleScopePresetSelect,
    handleSelectedSectionIndicesChange,
    handlePromptModeChange,
    handlePromptRequestChange,
    handleTemplateModeChange,
    handleGeneratePromptDrafts,
    handleDraftStatusChange,
    handleDraftPromptChange,
    handleSaveDraftPrompt,
    handleRenderSessionDefaultsChange,
    handleRenderAssetOverrideChange,
    handleResetRenderAssetOverrides,
    handleGenerateRenderAsset,
    handleRenderAssetPreview,
    handleRenderAssetDownload,
    handleReviewAssetEdit,
    handleReviewAssetMarkFinal,
  };
}
