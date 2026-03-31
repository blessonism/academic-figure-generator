import { CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  StudioConfirmedScopeSummary,
  StudioPromptDraft,
  StudioPromptDraftReviewStatus,
  StudioPromptMode,
  StudioStatusMessage,
} from '@/studio/types';

interface PromptStageProps {
  confirmedScopeSummary: StudioConfirmedScopeSummary | null;
  drafts: StudioPromptDraft[];
  promptMode: StudioPromptMode;
  promptRequest: string;
  templateMode: boolean;
  isGeneratingDrafts: boolean;
  savingDraftIds: Record<string, boolean>;
  statusMessage: StudioStatusMessage | null;
  onPromptModeChange: (mode: StudioPromptMode) => void;
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

export function PromptStage({
  confirmedScopeSummary,
  drafts,
  promptMode,
  promptRequest,
  templateMode,
  isGeneratingDrafts,
  savingDraftIds,
  statusMessage,
  onPromptModeChange,
  onPromptRequestChange,
  onTemplateModeChange,
  onGenerateDrafts,
  onDraftStatusChange,
  onDraftPromptChange,
  onSaveDraftPrompt,
}: PromptStageProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">生成草案</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            先生成可审核的 Prompt 草案，确认哪些图值得进入正式渲染，再继续到下一阶段。
          </div>

          {confirmedScopeSummary ? (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">已确认范围</p>
              <p className="mt-1 text-muted-foreground">
                {confirmedScopeSummary.documentName
                  ? `${confirmedScopeSummary.documentName} · `
                  : ''}
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
                  <SelectItem value="overall">整体架构图（1 条）</SelectItem>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">草案列表</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
