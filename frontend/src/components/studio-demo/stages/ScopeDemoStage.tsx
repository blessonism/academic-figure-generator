import { CheckCircle2, Layers3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DemoSection } from '@/studio-demo/mockData'

interface ScopeDemoStageProps {
  scopeConfirmed: boolean
  sections: DemoSection[]
  selectedSectionCount: number
  onConfirm: () => void
  onToggleSection: (sectionId: string) => void
}

export function ScopeDemoStage({
  scopeConfirmed,
  sections,
  selectedSectionCount,
  onConfirm,
  onToggleSection,
}: ScopeDemoStageProps) {
  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit border-sky-200 bg-sky-50 text-sky-700">
            Stage 01
          </Badge>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">范围确认</h3>
            <p className="text-sm leading-6 text-slate-600">
              默认只展示做范围判断真正需要的信息，避免用户过早进入草案和参数决策。
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => onToggleSection(section.id)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  section.selected
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="font-medium text-slate-900">{section.title}</p>
                    <p className="text-sm leading-6 text-slate-600">{section.summary}</p>
                  </div>
                  {section.selected ? <CheckCircle2 className="h-5 w-5 text-sky-600" /> : null}
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <Layers3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">当前已选 {selectedSectionCount} 个章节</p>
                <p className="text-sm text-slate-500">把复杂论文先缩到足够明确的输入边界。</p>
              </div>
            </div>
            <Button onClick={onConfirm} disabled={scopeConfirmed || selectedSectionCount === 0}>
              {scopeConfirmed ? '已确认范围' : '确认本轮范围'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
