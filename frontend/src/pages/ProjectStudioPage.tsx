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
  const currentStageIndex = STUDIO_STAGE_ORDER.indexOf(currentStage);
  const acceptedDraftCount = promptDrafts.filter((draft) => draft.status === 'accepted').length;
  const pendingDraftCount = promptDrafts.filter((draft) => draft.status === 'pending').length;
  const renderProcessingCount = renderAssets.filter((asset) => asset.status === 'processing').length;
  const renderCompletedCount = renderAssets.filter((asset) => asset.status === 'completed').length;
  const renderFailedCount = renderAssets.filter((asset) => asset.status === 'failed').length;
  const reviewVersionCount = reviewAssets.reduce((count, asset) => count + asset.versions.length, 0);
  const reviewFinalCount = reviewAssets.filter((asset) => Boolean(asset.finalVersionId)).length;

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
      promptRequest={promptRequest}
      templateMode={templateMode}
      isGeneratingDrafts={isGeneratingDrafts}
      savingDraftIds={savingPromptIds}
      statusMessage={statusMessage}
      onPromptModeChange={handlePromptModeChange}
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
      tasks={<StudioTaskCenter tasks={tasks} />}
    />
  );
}
