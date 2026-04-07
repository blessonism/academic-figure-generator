import { CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  getPromptFigureTypeHint,
  STUDIO_PROMPT_FIGURE_TYPE_OPTIONS,
} from '@/studio/promptGeneration';
import type {
  StudioConfirmedScopeSummary,
  StudioPromptDraft,
  StudioPromptFigureType,
  StudioPromptDraftReviewStatus,
  StudioPromptMode,
  StudioStatusMessage,
} from '@/studio/types';

interface PromptStageProps {
  confirmedScopeSummary: StudioConfirmedScopeSummary | null;
  drafts: StudioPromptDraft[];
  promptMode: StudioPromptMode;
  overallPromptFigureType: StudioPromptFigureType;
  sectionPromptFigureTypes: StudioPromptFigureType[];
  promptRequest: string;
  templateMode: boolean;
  isGeneratingDrafts: boolean;
  savingDraftIds: Record<string, boolean>;
  statusMessage: StudioStatusMessage | null;
  onPromptModeChange: (mode: StudioPromptMode) => void;
  onOverallPromptFigureTypeChange: (figureType: StudioPromptFigureType) => void;
  onSectionPromptFigureTypeToggle: (figureType: StudioPromptFigureType) => void;
  onSectionPromptFigureTypesReset: () => void;
  onPromptRequestChange: (value: string) => void;
  onTemplateModeChange: (enabled: boolean) => void;
  onGenerateDrafts: () => void;
  onDraftStatusChange: (draftId: string, status: StudioPromptDraftReviewStatus) => void;
  onDraftPromptChange: (draftId: string, promptText: string) => void;
  onSaveDraftPrompt: (draftId: string) => void;
}

function getDraftStatusLabel(status: StudioPromptDraftReviewStatus) {
  if (status === 'accepted') {
    return '已接受';
  }

  if (status === 'skipped') {
    return '已跳过';
  }

  return '待确认';
}

function getDraftStatusVariant(status: StudioPromptDraftReviewStatus) {
  if (status === 'accepted') {
    return 'secondary' as const;
  }

  if (status === 'skipped') {
    return 'outline' as const;
  }

  return 'default' as const;
}

function StagePanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function getDraftRiskLine(draft: StudioPromptDraft): string {
  if (draft.sourceSections.length === 0) {
    return '当前草案缺少明确来源章节，后续可追溯性偏弱。';
  }

  if (draft.generationStatus !== 'completed') {
    return `当前生成状态为 ${draft.generationStatus}，建议先确认是否需要重新生成。`;
  }

  if (draft.promptText.length > 240) {
    return '草案提示词较长，建议精简主叙事以避免渲染重点分散。';
  }

  return '当前草案可直接进入评审，重点检查图型、来源章节和表达聚焦度。';
}

export function PromptStage({
  confirmedScopeSummary,
  drafts,
  promptMode,
  overallPromptFigureType,
  sectionPromptFigureTypes,
  promptRequest,
  templateMode,
  isGeneratingDrafts,
  savingDraftIds,
  statusMessage,
  onPromptModeChange,
  onOverallPromptFigureTypeChange,
  onSectionPromptFigureTypeToggle,
  onSectionPromptFigureTypesReset,
  onPromptRequestChange,
  onTemplateModeChange,
  onGenerateDrafts,
  onDraftStatusChange,
  onDraftPromptChange,
  onSaveDraftPrompt,
}: PromptStageProps) {
  const acceptedDrafts = drafts.filter((draft) => draft.status === 'accepted');
  const promptFigureTypeHint = getPromptFigureTypeHint({
    promptMode,
    overallPromptFigureType,
    sectionPromptFigureTypes,
  });
  const isSectionAutoMode = sectionPromptFigureTypes.length === 0;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <StagePanel
        title="候选草案池"
        description="围绕已确认范围评审候选草案，决定哪些方案值得继续进入正式渲染。"
      >
        {drafts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            当前范围已确认，下一步请先生成草案，再决定哪些图进入正式渲染。
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div key={draft.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{draft.title}</p>
                      <Badge variant={getDraftStatusVariant(draft.status)}>
                        {getDraftStatusLabel(draft.status)}
                      </Badge>
                      <Badge variant="outline">{draft.figureType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      当前生成状态：{draft.generationStatus}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={draft.status === 'accepted' ? 'default' : 'outline'}
                      onClick={() => onDraftStatusChange(draft.id, 'accepted')}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      接受
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={draft.status === 'skipped' ? 'secondary' : 'outline'}
                      onClick={() => onDraftStatusChange(draft.id, 'skipped')}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      跳过
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <Textarea
                    value={draft.promptText}
                    onChange={(event) => onDraftPromptChange(draft.id, event.target.value)}
                    className="min-h-[160px]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <details className="rounded-lg border px-3 py-2 text-sm">
                      <summary className="cursor-pointer font-medium">查看来源范围</summary>
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        {draft.sourceSections.length > 0 ? (
                          draft.sourceSections.map((section) => (
                            <p key={`${draft.id}-${section.index}`}>
                              {section.index + 1}. {section.title}
                            </p>
                          ))
                        ) : (
                          <p>当前草案暂未返回明确的来源章节。</p>
                        )}
                      </div>
                    </details>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onSaveDraftPrompt(draft.id)}
                      disabled={!draft.promptText.trim() || Boolean(savingDraftIds[draft.id])}
                    >
                      {savingDraftIds[draft.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中…
                        </>
                      ) : (
                        '保存草案'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </StagePanel>

      <StagePanel
        title="用途标签 / 生成意图"
        description="先把这一轮草案生成的用途、范围和模板策略说清楚，后续筛选会更聚焦。"
      >
        {confirmedScopeSummary ? (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">已确认范围</p>
            <p className="mt-1 text-muted-foreground">
              {confirmedScopeSummary.documentName ? `${confirmedScopeSummary.documentName} · ` : ''}
              {confirmedScopeSummary.label} · {confirmedScopeSummary.sectionCount} 个章节
            </p>
          </div>
        ) : null}

        {statusMessage && (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">状态更新</p>
            <p className="mt-1 text-muted-foreground">{statusMessage.detail}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-2">
            <p className="text-sm font-medium">生成方式</p>
            <Select value={promptMode} onValueChange={(value) => onPromptModeChange(value as StudioPromptMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">聚焦单图草案（1 条）</SelectItem>
                <SelectItem value="sections">按章节生成多条草案</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">补充说明</p>
            <Textarea
              value={promptRequest}
              onChange={(event) => onPromptRequestChange(event.target.value)}
              placeholder="例如：突出本文贡献点，优先生成整体架构图和实验对比图。"
              className="min-h-[108px]"
              disabled={templateMode}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {promptMode === 'overall' ? '单图类型' : '图型偏好'}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">{promptFigureTypeHint}</p>
          </div>

          {promptMode === 'overall' ? (
            <Select
              value={overallPromptFigureType}
              onValueChange={(value) => onOverallPromptFigureTypeChange(value as StudioPromptFigureType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDIO_PROMPT_FIGURE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isSectionAutoMode ? 'secondary' : 'outline'}
                  aria-pressed={isSectionAutoMode}
                  onClick={onSectionPromptFigureTypesReset}
                >
                  自动推荐
                </Button>
                {STUDIO_PROMPT_FIGURE_TYPE_OPTIONS.map((option) => {
                  const isSelected = sectionPromptFigureTypes.includes(option.value);
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'secondary' : 'outline'}
                      aria-pressed={isSelected}
                      onClick={() => onSectionPromptFigureTypeToggle(option.value)}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 rounded-lg border px-3 py-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-primary"
            checked={templateMode}
            onChange={(event) => onTemplateModeChange(event.target.checked)}
          />
          <span className="text-muted-foreground">
            开启模板模式：优先输出无文字的结构型草案，用于后续自行补标注或做版式探索。
          </span>
        </label>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3">
          <div className="text-sm text-muted-foreground">
            当前已有 {drafts.length} 条草案，建议先聚焦最值得出图的那几条。
          </div>
          <Button onClick={onGenerateDrafts} disabled={isGeneratingDrafts}>
            {isGeneratingDrafts ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {drafts.length > 0 ? '重新生成草案' : '生成草案'}
              </>
            )}
          </Button>
        </div>
      </StagePanel>

      <StagePanel
        title="风险提示"
        description="把来源不明、状态异常或表达过重的草案提前暴露，减少后续渲染浪费。"
      >
        {drafts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            暂无草案，生成后这里会出现每条草案的评审风险提示。
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div key={`risk-${draft.id}`} className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{draft.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{getDraftRiskLine(draft)}</p>
              </div>
            ))}
          </div>
        )}
      </StagePanel>

      <StagePanel
        title="已保留集"
        description="把最终进入 Render 的候选方案单独收口，避免候选池和真正待出图列表混在一起。"
      >
        {acceptedDrafts.length > 0 ? (
          <div className="space-y-3">
            {acceptedDrafts.map((draft) => (
              <div key={`accepted-${draft.id}`} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-emerald-900">{draft.title}</p>
                  <Badge variant="secondary">{draft.figureType}</Badge>
                </div>
                <p className="mt-2 text-sm text-emerald-800">
                  来源章节 {draft.sourceSections.length} 个，当前可继续进入生成配图阶段。
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
            当前没有进入保留集的草案，请先在候选草案池中接受至少一条草案。
          </div>
        )}
      </StagePanel>
    </div>
  );
}
