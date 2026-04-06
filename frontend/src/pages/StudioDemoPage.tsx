import { ArrowRight, Sparkles } from 'lucide-react'

import { StudioDemoActionDock } from '@/components/studio-demo/StudioDemoActionDock'
import { StudioDemoCompletionCard } from '@/components/studio-demo/StudioDemoCompletionCard'
import { StudioDemoContextPanel } from '@/components/studio-demo/StudioDemoContextPanel'
import { StudioDemoHeader } from '@/components/studio-demo/StudioDemoHeader'
import { StudioDemoStageFlow } from '@/components/studio-demo/StudioDemoStageFlow'
import { PromptDemoStage } from '@/components/studio-demo/stages/PromptDemoStage'
import { RenderDemoStage } from '@/components/studio-demo/stages/RenderDemoStage'
import { ScopeDemoStage } from '@/components/studio-demo/stages/ScopeDemoStage'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useStudioDemoState } from '@/studio-demo/useStudioDemoState'

export function StudioDemoPage() {
  const {
    acceptedDraftCount,
    completion,
    contextOpen,
    currentStage,
    drafts,
    pendingDraftChanges,
    queuedAssetCount,
    renderAssets,
    scopeConfirmed,
    sections,
    selectedSectionCount,
    stageMeta,
    stageSummary,
    totalRenderCost,
    confirmScope,
    resetDemo,
    saveDraftDecisions,
    setCompletion,
    setContextOpen,
    setCurrentStage,
    submitRenderQueue,
    toggleSection,
    updateDraftStatus,
  } = useStudioDemoState()

  const actionDock =
    currentStage === 'scope' && !scopeConfirmed
      ? {
          detail: '确认本轮范围后，草案阶段会只围绕已选章节展开。',
          actionLabel: '确认当前范围',
          onAction: confirmScope,
        }
      : currentStage === 'prompt' && pendingDraftChanges
        ? {
            detail: '你有未保存的草案决策',
            actionLabel: '保存草案决策',
            onAction: saveDraftDecisions,
          }
        : currentStage === 'render' && queuedAssetCount === 0
          ? {
              detail: '当前参数已就绪，可以把选中的草案送入生成队列。',
              actionLabel: '提交生成任务',
              onAction: submitRenderQueue,
            }
          : null

  const mainContent =
    currentStage === 'scope' ? (
      <ScopeDemoStage
        sections={sections}
        selectedSectionCount={selectedSectionCount}
        scopeConfirmed={scopeConfirmed}
        onConfirm={confirmScope}
        onToggleSection={toggleSection}
      />
    ) : currentStage === 'prompt' ? (
      <PromptDemoStage drafts={drafts} onDraftStatusChange={updateDraftStatus} />
    ) : (
      <RenderDemoStage assets={renderAssets} totalCost={totalRenderCost} onSubmit={submitRenderQueue} />
    )

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 pb-28">
      <StudioDemoHeader
        contextOpen={contextOpen}
        onReset={resetDemo}
        onToggleContext={() => setContextOpen((open) => !open)}
      />

      <StudioDemoStageFlow
        acceptedDraftCount={acceptedDraftCount}
        currentStage={currentStage}
        queuedAssetCount={queuedAssetCount}
        scopeConfirmed={scopeConfirmed}
        onStageChange={setCurrentStage}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                    {stageMeta.eyebrow}
                  </Badge>
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                    {stageMeta.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {stageMeta.title}
                  </h2>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    {stageMeta.description}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">当前目标</p>
                    <p className="text-sm font-medium text-slate-900">{stageMeta.summary}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {completion ? (
            <StudioDemoCompletionCard
              title={completion.title}
              detail={completion.detail}
              onDismiss={() => setCompletion(null)}
            />
          ) : null}

          {mainContent}

          <Card className="border-slate-200 bg-slate-950 text-white shadow-sm">
            <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold">为什么先做独立 Demo？</p>
                <p className="text-sm leading-6 text-slate-300">
                  先验证结构、节奏和感受，再决定如何逐步替换正式 Studio，能明显降低重构风险。
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-slate-300">
                <span>下一步再把这个框架迁移到真实项目页</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {contextOpen ? (
          <StudioDemoContextPanel
            currentStage={currentStage}
            summaryLines={stageSummary[currentStage]}
            className="h-fit sticky top-24"
          />
        ) : null}
      </div>

      <StudioDemoActionDock
        open={Boolean(actionDock)}
        detail={actionDock?.detail ?? ''}
        actionLabel={actionDock?.actionLabel ?? ''}
        onAction={actionDock?.onAction ?? (() => {})}
      />
    </div>
  )
}
