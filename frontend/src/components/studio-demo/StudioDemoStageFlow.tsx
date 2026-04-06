import { CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DEMO_STAGE_META, type DemoStage } from '@/studio-demo/mockData'

interface StudioDemoStageFlowProps {
  acceptedDraftCount: number
  currentStage: DemoStage
  scopeConfirmed: boolean
  queuedAssetCount: number
  onStageChange: (stage: DemoStage) => void
}

function getStageStatus(stage: DemoStage, scopeConfirmed: boolean, acceptedDraftCount: number, queuedAssetCount: number) {
  if (stage === 'scope') {
    return scopeConfirmed ? 'complete' : 'current'
  }

  if (stage === 'prompt') {
    if (!scopeConfirmed) return 'blocked'
    return acceptedDraftCount > 0 ? 'complete' : 'current'
  }

  if (acceptedDraftCount === 0) return 'blocked'
  return queuedAssetCount > 0 ? 'complete' : 'current'
}

export function StudioDemoStageFlow({
  acceptedDraftCount,
  currentStage,
  scopeConfirmed,
  queuedAssetCount,
  onStageChange,
}: StudioDemoStageFlowProps) {
  const stages: DemoStage[] = ['scope', 'prompt', 'render']

  return (
    <div className="grid gap-3 xl:grid-cols-[1.25fr_1fr_1fr]">
      {stages.map((stage) => {
        const meta = DEMO_STAGE_META[stage]
        const isCurrent = currentStage === stage
        const stageStatus = getStageStatus(stage, scopeConfirmed, acceptedDraftCount, queuedAssetCount)

        return (
          <Card
            key={stage}
            className={cn(
              'border-slate-200 transition-all',
              isCurrent && 'border-sky-300 bg-sky-50/70 shadow-sm',
              stageStatus === 'blocked' && 'border-amber-200 bg-amber-50/60',
            )}
          >
            <CardContent className="p-3">
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  'h-auto w-full justify-start rounded-2xl px-3 py-3 text-left hover:bg-transparent',
                  isCurrent ? 'gap-4' : 'gap-3',
                )}
                onClick={() => onStageChange(stage)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-sm">
                  {stageStatus === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : stageStatus === 'blocked' ? (
                    <LockKeyhole className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-sky-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{meta.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'bg-white/80 text-[11px]',
                        stageStatus === 'complete' && 'border-emerald-200 text-emerald-700',
                        stageStatus === 'blocked' && 'border-amber-200 text-amber-700',
                        stageStatus === 'current' && 'border-sky-200 text-sky-700',
                      )}
                    >
                      {stageStatus === 'complete'
                        ? '已完成'
                        : stageStatus === 'blocked'
                          ? '待解锁'
                          : '当前阶段'}
                    </Badge>
                  </div>

                  {isCurrent ? (
                    <p className="text-sm leading-6 text-slate-600">{meta.summary}</p>
                  ) : (
                    <p className="text-xs text-slate-500">{meta.eyebrow}</p>
                  )}
                </div>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
