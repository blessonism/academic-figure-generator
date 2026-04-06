import { Coins, ImageIcon, WandSparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DemoRenderAsset } from '@/studio-demo/mockData'

interface RenderDemoStageProps {
  assets: DemoRenderAsset[]
  totalCost: number
  onSubmit: () => void
}

export function RenderDemoStage({
  assets,
  totalCost,
  onSubmit,
}: RenderDemoStageProps) {
  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit border-sky-200 bg-sky-50 text-sky-700">
            Stage 03
          </Badge>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">生成配图</h3>
            <p className="text-sm leading-6 text-slate-600">
              出图前统一收拢参数、预算和资产状态，让用户更放心地执行最终动作。
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">默认分辨率</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">2K</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">主比例</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">16:9 / 4:3</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">预估成本</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">¥{totalCost.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{asset.title}</p>
                      <p className="text-sm text-slate-500">
                        {asset.resolution} · {asset.ratio} · {asset.cost}
                      </p>
                    </div>
                  </div>
                  <Badge variant={asset.status === 'queued' ? 'default' : 'secondary'}>
                    {asset.status === 'queued' ? '已进入队列' : '待提交'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={onSubmit}>
              <WandSparkles className="h-4 w-4" />
              提交生成任务
            </Button>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <Coins className="mt-0.5 h-4 w-4" />
              <p>Demo 阶段先强调“提交前决策”，正式版再补参数细化和实时任务反馈。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
