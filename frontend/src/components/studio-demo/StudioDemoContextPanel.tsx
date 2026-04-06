import { BookOpenText, ClipboardList, Coins, Lightbulb } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type DemoStage } from '@/studio-demo/mockData'

interface StudioDemoContextPanelProps {
  className?: string
  currentStage: DemoStage
  summaryLines: string[]
}

const STAGE_NOTES: Record<DemoStage, { title: string; hint: string; icon: typeof BookOpenText }> = {
  scope: {
    title: '输入上下文',
    hint: '此时只展示用户做范围判断真正需要的信息，避免过早被草案和参数打扰。',
    icon: BookOpenText,
  },
  prompt: {
    title: '当前阶段摘要',
    hint: '右侧只保留保留数、筛选意图和下一步建议，帮助用户快速做“继续还是跳过”的决定。',
    icon: ClipboardList,
  },
  render: {
    title: '预算与提交摘要',
    hint: '在出图前汇总预算、比例和当前待处理资产，减少误点和成本焦虑。',
    icon: Coins,
  },
}

export function StudioDemoContextPanel({
  className,
  currentStage,
  summaryLines,
}: StudioDemoContextPanelProps) {
  const note = STAGE_NOTES[currentStage]
  const Icon = note.icon

  return (
    <Card className={cn('border-slate-200 bg-white/90 shadow-sm', className)}>
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-900">{note.title}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">辅助信息只在需要时出现</p>
            </div>
          </div>
          <Badge variant="outline" className="border-slate-200 text-slate-600">
            Context Rail
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          {summaryLines.map((line) => (
            <div key={line} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span>{line}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-4 w-4 text-amber-700" />
            <p className="text-sm leading-6 text-amber-900">{note.hint}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
