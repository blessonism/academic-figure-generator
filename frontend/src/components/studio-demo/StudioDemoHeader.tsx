import { PanelRight, RotateCcw, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface StudioDemoHeaderProps {
  contextOpen: boolean
  onReset: () => void
  onToggleContext: () => void
}

export function StudioDemoHeader({
  contextOpen,
  onReset,
  onToggleContext,
}: StudioDemoHeaderProps) {
  return (
    <Card className="overflow-hidden border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_36%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(255,255,255,1))] shadow-sm">
      <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="outline" className="border-sky-200 bg-white/70 text-sky-700">
            Studio Demo
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Scientific Figure Workflow Redesign
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              这是一版独立的半交互 demo，用来验证新版 Studio 是否能把“流程更清晰”和
              “专业工作台感”同时做出来。
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={onToggleContext}>
            <PanelRight className="h-4 w-4" />
            {contextOpen ? '收起上下文' : '展开上下文'}
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            重置 Demo
          </Button>
          <Button>
            <Sparkles className="h-4 w-4" />
            查看新版节奏
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
