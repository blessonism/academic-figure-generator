import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudioHealthChecklist } from '@/components/studio/StudioHealthChecklist';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { StudioInspector } from '@/components/studio/StudioInspector';
import { StudioShell } from '@/components/studio/StudioShell';
import { StudioStageNav } from '@/components/studio/StudioStageNav';
import { StudioTaskCenter } from '@/components/studio/StudioTaskCenter';
import { IngestStage } from '@/components/studio/stages/IngestStage';
import { PromptStage } from '@/components/studio/stages/PromptStage';
import { RenderStage } from '@/components/studio/stages/RenderStage';
import { ReviewStage } from '@/components/studio/stages/ReviewStage';
import { ScopeStage } from '@/components/studio/stages/ScopeStage';
import { STUDIO_STAGE_LABELS, STUDIO_STAGE_OBJECTIVES, STUDIO_STAGE_ORDER } from '@/studio/constants';
import type { StudioStageNavItem } from '@/studio/types';
import { useProjectStudio } from '@/studio/useProjectStudio';
import { api } from '@/lib/api';
import { getApiErrorMessage, humanizeErrorText } from '@/lib/apiError';
import { fetchAuthedBlob, triggerBrowserDownload } from '@/lib/blob';
import { Button } from '@/components/ui/button';
import { StatusToast } from '@/components/ui/status-toast';
import { Download } from 'lucide-react';
import type { ProjectReferenceAsset } from '@/lib/market';

const DEFAULT_RENDER_RUNNING_DETAIL = '后台正在生成图片，可在生成配图阶段查看进度。';
const DEFAULT_PROMPT_RUNNING_DETAIL = '正在生成 Prompt 草案，请稍候。';

function isAutoRetryDetail(detail: string) {
  return detail.includes('系统正在自动重试');
}

function normalizePromptToastMessage(input: {
  isGeneratingDrafts: boolean;
  statusMessage: { status: 'running' | 'completed' | 'failed'; detail: string };
}) {
  const { isGeneratingDrafts, statusMessage } = input;
  const friendlyDetail = humanizeErrorText(statusMessage.detail) || statusMessage.detail;

  if (!isGeneratingDrafts || statusMessage.status !== 'running') {
    return {
      ...statusMessage,
      detail: friendlyDetail,
    };
  }

  if (
    friendlyDetail === DEFAULT_PROMPT_RUNNING_DETAIL
    || isAutoRetryDetail(friendlyDetail)
  ) {
    return {
      ...statusMessage,
      detail: friendlyDetail,
    };
  }

  return {
    status: 'failed' as const,
    detail: friendlyDetail.startsWith('草案生成失败：')
      ? friendlyDetail
      : `草案生成失败：${friendlyDetail}`,
  };
}

function getToastMessage(input: {
  currentStage: string;
  isGeneratingDrafts: boolean;
  renderProcessingCount: number;
  statusMessage: { status: 'running' | 'completed' | 'failed'; detail: string } | null;
  tasks: Array<{ id: string; detail: string; status: string }>;
}) {
  const { currentStage, isGeneratingDrafts, renderProcessingCount, statusMessage, tasks } = input;
  if (!statusMessage) {
    if (currentStage === 'render' && renderProcessingCount > 0) {
      const renderTask = tasks.find((task) => task.id === 'render-running');
      return {
        status: 'running' as const,
        detail: renderTask?.detail || DEFAULT_RENDER_RUNNING_DETAIL,
      };
    }

    return null;
  }

  const normalizedStatusMessage = normalizePromptToastMessage({
    isGeneratingDrafts,
    statusMessage,
  });

  if (normalizedStatusMessage.status === 'failed') {
    return normalizedStatusMessage;
  }

  if (
    currentStage === 'prompt'
    && isGeneratingDrafts
    && normalizedStatusMessage.status === 'running'
  ) {
    return normalizedStatusMessage;
  }

  if (currentStage === 'render' && renderProcessingCount > 0) {
    if (normalizedStatusMessage.status === 'running') {
      return normalizedStatusMessage;
    }

    const renderTask = tasks.find((task) => task.id === 'render-running');
    return {
      status: 'running' as const,
      detail: renderTask?.detail || DEFAULT_RENDER_RUNNING_DETAIL,
    };
  }

  return null;
}

export function ProjectStudioPage() {
  const {
    currentProject,
    currentStage,
    documents,
    confirmedScopeSummary,
    hasOcrConfig,
    hasConfirmedScope,
    isCurrentScopeConfirmed,
    hasParsedDocument,
    healthItems,
    isGeneratingDrafts,
    isLoading,
    isUploading,
    ocrLoading,
    parsedDocument,
    parsedSections,
    projectId,
    promptDrafts,
    promptMode,
    overallPromptFigureType,
    sectionPromptFigureTypes,
    promptRequest,
    renderAssets,
    renderColorSchemeOptions,
    renderImagePricing,
    renderProjectDefaults,
    renderSessionDefaults,
    reviewAssets,
    savingPromptIds,
    scopeMode,
    selectedScopePresetId,
    selectedSectionIndices,
    statusMessage,
    templateMode,
    tasks,
    uploadProgress,
    handleDraftPromptChange,
    handleDraftStatusChange,
    handleDownloadMarkdown,
    handleConfirmScope,
    handleFileChange,
    handleGeneratePromptDrafts,
    handleGenerateRenderAsset,
    handlePromptModeChange,
    handleOverallPromptFigureTypeChange,
    handleSectionPromptFigureTypeToggle,
    handleSectionPromptFigureTypesReset,
    handlePromptRequestChange,
    handleRenderAssetDownload,
    handleRenderAssetOverrideChange,
    handleRenderAssetPreview,
    handleRenderSessionDefaultsChange,
    handleReviewAssetEdit,
    handleReviewAssetMarkFinal,
    handleResetRenderAssetOverrides,
    handleSaveDraftPrompt,
    handleStageChange,
    handleScopeModeChange,
    handleScopePresetSelect,
    handleSelectedSectionIndicesChange,
    handleTemplateModeChange,
    handleTriggerOcr,
  } = useProjectStudio();
  const [referenceAssets, setReferenceAssets] = useState<ProjectReferenceAsset[]>([]);
  const [referenceAssetsError, setReferenceAssetsError] = useState<string | null>(null);
  const [downloadingReferenceAssetId, setDownloadingReferenceAssetId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    status: 'running' | 'completed' | 'failed';
    detail: string;
  } | null>(null);
  const lastToastSignatureRef = useRef<string | null>(null);
  const currentStageIndex = STUDIO_STAGE_ORDER.indexOf(currentStage);
  const acceptedDraftCount = promptDrafts.filter((draft) => draft.status === 'accepted').length;
  const pendingDraftCount = promptDrafts.filter((draft) => draft.status === 'pending').length;
  const renderProcessingCount = renderAssets.filter((asset) => asset.status === 'processing').length;
  const renderCompletedCount = renderAssets.filter((asset) => asset.status === 'completed').length;
  const renderFailedCount = renderAssets.filter((asset) => asset.status === 'failed').length;
  const reviewVersionCount = reviewAssets.reduce((count, asset) => count + asset.versions.length, 0);
  const reviewFinalCount = reviewAssets.filter((asset) => Boolean(asset.finalVersionId)).length;

  const loadReferenceAssets = useCallback(async () => {
    if (!projectId) {
      setReferenceAssets([]);
      return;
    }

    try {
      const response = await api.get(`/projects/${projectId}/reference-assets`);
      setReferenceAssets(response.data || []);
      setReferenceAssetsError(null);
    } catch (error) {
      setReferenceAssets([]);
      setReferenceAssetsError(getApiErrorMessage(error, '参考素材加载失败。'));
    }
  }, [projectId]);

  useEffect(() => {
    void loadReferenceAssets();
  }, [loadReferenceAssets]);

  useEffect(() => {
    const nextToastMessage = getToastMessage({
      currentStage,
      isGeneratingDrafts,
      renderProcessingCount,
      statusMessage,
      tasks,
    });

    if (!nextToastMessage) {
      lastToastSignatureRef.current = null;
      setToastMessage((current) => (current?.status === 'running' ? null : current));
      return;
    }

    const signature = `${nextToastMessage.status}:${nextToastMessage.detail}`;
    if (lastToastSignatureRef.current === signature) {
      return;
    }

    lastToastSignatureRef.current = signature;
    setToastMessage(nextToastMessage);
  }, [currentStage, isGeneratingDrafts, renderProcessingCount, statusMessage, tasks]);

  const handleToastClose = useCallback(() => {
    lastToastSignatureRef.current = null;
    setToastMessage(null);
  }, []);

  const handleReferenceAssetDownload = useCallback(async (asset: ProjectReferenceAsset) => {
    if (!asset.download_url) {
      return;
    }

    setDownloadingReferenceAssetId(asset.id);
    try {
      const { blob, ext } = await fetchAuthedBlob(asset.download_url);
      triggerBrowserDownload(blob, `${asset.title}.${ext}`);
    } catch (error) {
      setReferenceAssetsError(getApiErrorMessage(error, '参考素材下载失败。'));
    } finally {
      setDownloadingReferenceAssetId(null);
    }
  }, []);

  const stages: StudioStageNavItem[] = STUDIO_STAGE_ORDER.map((stage, index) => {
    if (stage === 'scope' && !hasParsedDocument) {
      return {
        id: stage,
        label: STUDIO_STAGE_LABELS[stage],
        objective: STUDIO_STAGE_OBJECTIVES[stage],
        status: 'blocked',
        reason: '缺少已解析文档',
        nextAction: '请先上传并解析论文',
      };
    }

    if (stage === 'prompt' && !hasConfirmedScope) {
      return {
        id: stage,
        label: STUDIO_STAGE_LABELS[stage],
        objective: STUDIO_STAGE_OBJECTIVES[stage],
        status: index === currentStageIndex ? 'current' : 'blocked',
        reason: '尚未确认范围',
        nextAction: '请先确认本次参考范围',
      };
    }

    if (stage === 'render' && acceptedDraftCount === 0) {
      return {
        id: stage,
        label: STUDIO_STAGE_LABELS[stage],
        objective: STUDIO_STAGE_OBJECTIVES[stage],
        status: index === currentStageIndex ? 'current' : 'blocked',
        reason: '尚未接受草案',
        nextAction: '请先在草案阶段接受至少一条草案',
      };
    }

    if (stage === 'review' && reviewAssets.length === 0) {
      return {
        id: stage,
        label: STUDIO_STAGE_LABELS[stage],
        objective: STUDIO_STAGE_OBJECTIVES[stage],
        status: index === currentStageIndex ? 'current' : 'blocked',
        reason: '尚未生成可交付图片',
        nextAction: '请先在生成配图阶段完成至少一张图片',
      };
    }

    return {
      id: stage,
      label: STUDIO_STAGE_LABELS[stage],
      objective: STUDIO_STAGE_OBJECTIVES[stage],
      status: index < currentStageIndex ? 'complete' : index === currentStageIndex ? 'current' : 'idle',
    };
  });
  const canConfirmScope =
    hasParsedDocument && (scopeMode === 'preset' || selectedSectionIndices.length > 0);

  const mainContent = isLoading ? (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">加载中</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">正在加载项目与文档状态...</p>
      </CardContent>
    </Card>
  ) : currentStage === 'ingest' ? (
    <IngestStage
      documents={documents}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
      hasOcrConfig={hasOcrConfig}
      ocrLoading={ocrLoading}
      statusMessage={statusMessage}
      onUploadClick={() => {}}
      onFileChange={handleFileChange}
      onTriggerOcr={handleTriggerOcr}
      onDownloadMarkdown={handleDownloadMarkdown}
    />
  ) : currentStage === 'scope' ? (
    <ScopeStage
      mode={scopeMode}
      selectedPresetId={selectedScopePresetId}
      documentName={parsedDocument?.original_filename}
      sections={parsedSections}
      selectedSectionIndices={selectedSectionIndices}
      canConfirm={canConfirmScope}
      isConfirmed={isCurrentScopeConfirmed}
      onModeChange={handleScopeModeChange}
      onPresetSelect={handleScopePresetSelect}
      onSelectedSectionIndicesChange={handleSelectedSectionIndicesChange}
      onConfirm={handleConfirmScope}
    />
  ) : currentStage === 'prompt' ? (
    <PromptStage
      confirmedScopeSummary={confirmedScopeSummary}
      drafts={promptDrafts}
      promptMode={promptMode}
      overallPromptFigureType={overallPromptFigureType}
      sectionPromptFigureTypes={sectionPromptFigureTypes}
      promptRequest={promptRequest}
      templateMode={templateMode}
      isGeneratingDrafts={isGeneratingDrafts}
      savingDraftIds={savingPromptIds}
      statusMessage={statusMessage}
      onPromptModeChange={handlePromptModeChange}
      onOverallPromptFigureTypeChange={handleOverallPromptFigureTypeChange}
      onSectionPromptFigureTypeToggle={handleSectionPromptFigureTypeToggle}
      onSectionPromptFigureTypesReset={handleSectionPromptFigureTypesReset}
      onPromptRequestChange={handlePromptRequestChange}
      onTemplateModeChange={handleTemplateModeChange}
      onGenerateDrafts={handleGeneratePromptDrafts}
      onDraftStatusChange={handleDraftStatusChange}
      onDraftPromptChange={handleDraftPromptChange}
      onSaveDraftPrompt={handleSaveDraftPrompt}
    />
  ) : currentStage === 'render' ? (
    <RenderStage
      projectDefaults={renderProjectDefaults}
      sessionDefaults={renderSessionDefaults}
      colorSchemeOptions={renderColorSchemeOptions}
      imagePricing={renderImagePricing}
      assets={renderAssets}
      statusMessage={statusMessage}
      onSessionDefaultsChange={handleRenderSessionDefaultsChange}
      onAssetOverrideChange={handleRenderAssetOverrideChange}
      onResetAssetOverrides={handleResetRenderAssetOverrides}
      onGenerateAsset={handleGenerateRenderAsset}
      onPreviewAsset={handleRenderAssetPreview}
      onDownloadAsset={handleRenderAssetDownload}
    />
  ) : currentStage === 'review' ? (
    <ReviewStage
      assets={reviewAssets}
      statusMessage={statusMessage}
      onEditAsset={handleReviewAssetEdit}
      onMarkVersionFinal={handleReviewAssetMarkFinal}
      onPreviewAsset={handleRenderAssetPreview}
      onDownloadAsset={handleRenderAssetDownload}
    />
  ) : (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{STUDIO_STAGE_LABELS[currentStage]}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Ingest 已接入真实文档流程，后续阶段画布会继续逐步替换旧工作台能力。
        </p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <StatusToast message={toastMessage} onClose={handleToastClose} />
      <StudioShell
        header={<StudioHeader projectId={projectId} currentStage={currentStage} />}
        stageNav={
          <StudioStageNav currentStage={currentStage} stages={stages} onStageSelect={handleStageChange} />
        }
        sidebar={<StudioHealthChecklist items={healthItems} />}
        main={mainContent}
        inspector={
          <StudioInspector
            title="专业摘要面板"
            description={
              currentStage === 'scope'
                ? '围绕范围确认展示推荐依据、已选章节和下一步动作。'
                : currentStage === 'prompt'
                  ? '围绕草案评审展示保留数量、评审风险和下一步建议。'
                  : currentStage === 'render'
                    ? '围绕提交前决策展示参数、预算和队列进度。'
                    : currentStage === 'review'
                      ? '围绕交付阶段展示版本状态、最终稿标记和下载准备情况。'
                      : '围绕输入准备展示文档、解析状态与进入下一阶段的就绪程度。'
            }
          >
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">项目名称：{currentProject?.name ?? `项目 ${projectId ?? '未命名'}`}</p>
              <p className="text-muted-foreground">文档数量：{documents.length}</p>
              {currentStage === 'scope' ? (
                <>
                  <p className="text-muted-foreground">
                    当前文档：{parsedDocument?.original_filename ?? '暂无可用文档'}
                  </p>
                  <p className="text-muted-foreground">章节数量：{parsedSections.length}</p>
                  <p className="text-muted-foreground">已选章节：{selectedSectionIndices.length}</p>
                </>
              ) : currentStage === 'prompt' ? (
                <>
                  <p className="text-muted-foreground">草案总数：{promptDrafts.length}</p>
                  <p className="text-muted-foreground">待确认：{pendingDraftCount}</p>
                  <p className="text-muted-foreground">已接受：{acceptedDraftCount}</p>
                </>
              ) : currentStage === 'render' ? (
                <>
                  <p className="text-muted-foreground">已接受草案：{acceptedDraftCount}</p>
                  <p className="text-muted-foreground">处理中：{renderProcessingCount}</p>
                  <p className="text-muted-foreground">已完成：{renderCompletedCount}</p>
                  <p className="text-muted-foreground">失败：{renderFailedCount}</p>
                </>
              ) : currentStage === 'review' ? (
                <>
                  <p className="text-muted-foreground">待交付结果：{reviewAssets.length}</p>
                  <p className="text-muted-foreground">版本总数：{reviewVersionCount}</p>
                  <p className="text-muted-foreground">已标记最终稿：{reviewFinalCount}</p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  解析结果：{hasParsedDocument ? '已具备可用章节结构' : '尚未获得可用章节结构'}
                </p>
              )}
            </div>
          </StudioInspector>
        }
        tasks={
          <>
            <StudioTaskCenter tasks={tasks} />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">参考素材库</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {referenceAssetsError ? (
                  <p className="text-sm text-destructive">{referenceAssetsError}</p>
                ) : null}
                {referenceAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    当前项目还没有导入市场参考素材。你可以在市场详情页直接导入。
                  </p>
                ) : (
                  referenceAssets.map((asset) => (
                    <div key={asset.id} className="rounded-xl border p-3">
                      <p className="text-sm font-medium text-foreground">{asset.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        来源：{asset.source_type === 'market_item' ? '配图市场' : asset.source_type}
                      </p>
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleReferenceAssetDownload(asset)}
                        disabled={downloadingReferenceAssetId === asset.id}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {downloadingReferenceAssetId === asset.id ? '下载中...' : '下载素材'}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        }
      />
    </>
  );
}
