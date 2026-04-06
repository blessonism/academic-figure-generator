import { Check, CornerDownRight, SkipForward } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DemoDraft } from '@/studio-demo/mockData'

interface PromptDemoStageProps {
  drafts: DemoDraft[]
  onDraftStatusChange: (draftId: string, status: DemoDraft['status']) => void
}

export function PromptDemoStage({
  drafts,
  onDraftStatusChange,
}: PromptDemoStageProps) {
  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit border-sky-200 bg-sky-50 text-sky-700">
            Stage 02
          </Badge>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Prompt 草案</h3>
            <p className="text-sm leading-6 text-slate-600">
              这一层先只做保留或跳过判断，把更复杂的参数留到下一阶段处理。
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{draft.title}</Badge>
                    <Badge variant={draft.status === 'accepted' ? 'default' : 'secondary'}>
                      {draft.status === 'accepted'
                        ? '已接受'
                        : draft.status === 'skipped'
                          ? '已跳过'
                          : '待判断'}
                    </Badge>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{draft.focus}</p>
                  <p className="text-sm leading-6 text-slate-600">{draft.rationale}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onDraftStatusChange(draft.id, 'accepted')}
                    aria-label={`接受${draft.title}`}
                  >
                    <Check className="h-4 w-4" />
                    接受{draft.title}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => onDraftStatusChange(draft.id, 'skipped')}
                  >
                    <SkipForward className="h-4 w-4" />
                    跳过
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <CornerDownRight className="mt-0.5 h-4 w-4 text-sky-600" />
              <p>
                这里刻意把动作压缩成“接受 / 跳过”，不让用户在这一层就处理过多参数。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
