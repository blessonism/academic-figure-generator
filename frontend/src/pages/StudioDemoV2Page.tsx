import {
  ArrowRight,
  CheckCircle2,
  FileStack,
  Flag,
  FolderKanban,
  Gauge,
  Layers3,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type DemoV2Stage } from '@/studio-demo-v2/mockData'
import { useStudioDemoV2State } from '@/studio-demo-v2/useStudioDemoV2State'

function ShellCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
}: {
  title: string
  subtitle?: string
  icon: typeof FileStack
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('border-slate-200 bg-white shadow-sm', className)}>
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
            {subtitle ? <p className="text-sm leading-6 text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  )
}

function StageRail({
  currentStage,
  onChange,
}: {
  currentStage: DemoV2Stage
  onChange: (stage: DemoV2Stage) => void
}) {
  const stages: Array<{ id: DemoV2Stage; label: string; caption: string }> = [
    { id: 'scope', label: 'Scope 设计', caption: '输入边界' },
    { id: 'prompt', label: 'Prompt 评审', caption: '草案策展' },
    { id: 'render', label: 'Render 提交', caption: '规格确认' },
  ]

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {stages.map((stage) => {
        const active = currentStage === stage.id

        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onChange(stage.id)}
            className={cn(
              'rounded-2xl border px-4 py-4 text-left transition-all',
              active
                ? 'border-sky-300 bg-sky-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{stage.label}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{stage.caption}</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  active ? 'border-sky-200 bg-white text-sky-700' : 'border-slate-200 text-slate-500',
                )}
              >
                {active ? '当前' : '查看'}
              </Badge>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function StudioDemoV2Page() {
  const {
    acceptedDrafts,
    assets,
    drafts,
    estimatedCost,
    meta,
    recommendedPreset,
    sections,
    spec,
    stage,
    submissionConfirmed,
    summaryMetrics,
    usageLabel,
    confirmSubmission,
    resetV2Demo,
    setRecommendedPreset,
    setStage,
    setUsageLabel,
    switchTo4K,
    toggleDraftAcceptance,
    toggleSection,
  } = useStudioDemoV2State()

  return (
    <div className="mx-auto max-w-[1540px] space-y-5 px-4 pb-16 pt-5 md:px-6">
      <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(135deg,_#0f172a,_#111827_48%,_#172554)] text-white shadow-lg shadow-slate-950/10">
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
              Studio Demo V2
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">更细粒度的研究工作台</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                这一版保留第一轮 demo 作为基线，继续把阶段内部拆成更专业的决策面板，让 Studio 更像真实科研生产工具。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={resetV2Demo}>
              <RefreshCcw className="h-4 w-4" />
              重置 V2
            </Button>
            <Button className="bg-white text-slate-950 hover:bg-slate-100">
              <Sparkles className="h-4 w-4" />
              专业模式预览
            </Button>
          </div>
        </CardContent>
      </Card>

      <StageRail currentStage={stage} onChange={setStage} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                    第二轮 Demo
                  </Badge>
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                    {meta.label}
                  </Badge>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-slate-600">{meta.objective}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Review Hint</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-700">{meta.reviewHint}</p>
              </div>
            </CardContent>
          </Card>

          {stage === 'scope' ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <ShellCard
                title="输入来源确认"
                subtitle="先确认本轮工作基于哪份论文、哪些页面和解析状态。"
                icon={FileStack}
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Source File</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">multimodal-attention-paper.pdf</p>
                    <p className="mt-1 text-sm text-slate-500">已完成 OCR 与结构分段，可直接进入范围设计。</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">解析状态</p>
                      <p className="mt-2 text-sm font-semibold text-emerald-700">Ready</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">候选页段</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{sections.length} 个</p>
                    </div>
                  </div>
                </div>
              </ShellCard>

              <ShellCard
                title="推荐范围"
                subtitle="把系统推荐和人工判断并列展示，帮助用户更快收敛。"
                icon={Flag}
              >
                <div className="grid gap-3">
                  {[
                    { id: 'methods-models', name: '方法与模型', note: '优先支持总览图和模块图' },
                    { id: 'full-paper', name: '整篇论文', note: '信息更全，但容易稀释重点' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setRecommendedPreset(preset.id)}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition-colors',
                        recommendedPreset === preset.id
                          ? 'border-sky-300 bg-sky-50'
                          : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <p className="text-sm font-semibold text-slate-900">{preset.name}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{preset.note}</p>
                    </button>
                  ))}
                </div>
              </ShellCard>

              <ShellCard
                title="手动微调"
                subtitle="允许用户在推荐范围基础上再精调，避免推荐结果过于粗糙。"
                icon={Layers3}
              >
                <div className="space-y-3">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        'w-full rounded-2xl border p-4 text-left transition-colors',
                        section.selected
                          ? 'border-sky-300 bg-sky-50'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">{section.note}</p>
                        </div>
                        {section.selected ? <CheckCircle2 className="h-5 w-5 text-sky-600" /> : null}
                      </div>
                    </button>
                  ))}
                </div>
              </ShellCard>

              <ShellCard
                title="范围摘要"
                subtitle="把输入边界最终收口成可执行的任务摘要。"
                icon={Gauge}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">推荐模式</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {recommendedPreset === 'methods-models' ? '方法与模型' : '整篇论文'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">可进入草案阶段</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">是</p>
                  </div>
                </div>
              </ShellCard>
            </div>
          ) : null}

          {stage === 'prompt' ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <ShellCard
                title="候选草案池"
                subtitle="让用户判断每个候选是否值得进入渲染阶段。"
                icon={FolderKanban}
              >
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-900">{draft.name}</p>
                          <p className="text-sm leading-6 text-slate-600">{draft.summary}</p>
                        </div>
                        <Button
                          variant={draft.accepted ? 'default' : 'outline'}
                          onClick={() => toggleDraftAcceptance(draft.id)}
                        >
                          {draft.accepted ? '已保留' : '加入保留集'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ShellCard>

              <ShellCard
                title="用途标签"
                subtitle="把草案用途先定义清楚，后续参数选择会更聚焦。"
                icon={Flag}
              >
                <div className="flex flex-wrap gap-3">
                  {(['封面主图', '方法总览', '实验补图'] as const).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setUsageLabel(label)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm transition-colors',
                        usageLabel === label
                          ? 'border-sky-300 bg-sky-50 text-sky-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  当前主用途：<span className="font-semibold text-slate-900">{usageLabel}</span>
                </div>
              </ShellCard>

              <ShellCard
                title="风险提示"
                subtitle="把潜在的图像风险提前暴露，让评审更专业。"
                icon={ShieldAlert}
              >
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{draft.name}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{draft.risk}</p>
                    </div>
                  ))}
                </div>
              </ShellCard>

              <ShellCard
                title="保留集"
                subtitle="把最终进入 Render 的候选集独立收口。"
                icon={CheckCircle2}
              >
                <div className="space-y-3">
                  {acceptedDrafts.length > 0 ? (
                    acceptedDrafts.map((draft) => (
                      <div key={draft.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-900">{draft.name}</p>
                        <p className="mt-2 text-sm text-emerald-800">{draft.summary}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      当前没有进入保留集的草案。
                    </div>
                  )}
                </div>
              </ShellCard>
            </div>
          ) : null}

          {stage === 'render' ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <ShellCard
                title="输出规格"
                subtitle="先把规格切清楚，后续预算与产出预期才有意义。"
                icon={Gauge}
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">当前规格：{spec}</p>
                    <p className="mt-2 text-sm text-slate-600">主比例 16:9，关键资产允许按内容切换到 4:3。</p>
                  </div>
                  <Button variant="outline" onClick={switchTo4K}>
                    切换到 4K 规格
                  </Button>
                </div>
              </ShellCard>

              <ShellCard
                title="成本预估"
                subtitle="把规格变化实时映射到预算，降低决策不确定性。"
                icon={Gauge}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">估算成本</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">¥{estimatedCost.toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">资产数量</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{assets.length} 张</p>
                  </div>
                </div>
              </ShellCard>

              <ShellCard
                title="资产队列"
                subtitle="以更接近生产任务单的形式展示待出图资产。"
                icon={FolderKanban}
              >
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{asset.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{asset.spec} · {asset.ratio}</p>
                        </div>
                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                          待提交
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ShellCard>

              <ShellCard
                title="提交确认"
                subtitle="把最终提交前的检查单显式化，强化专业感和可控性。"
                icon={CheckCircle2}
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>已确认规格与成本</li>
                      <li>已确认进入队列的资产清单</li>
                      <li>已确认本轮输出用途为学术主图/副图</li>
                    </ul>
                  </div>
                  <Button onClick={confirmSubmission}>提交生成确认</Button>
                  {submissionConfirmed ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                      提交清单已确认
                    </div>
                  ) : null}
                </div>
              </ShellCard>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card className="sticky top-6 border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">专业摘要面板</h2>
                  <p className="text-sm text-slate-500">固定展示跨阶段关键指标</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-3">
                {summaryMetrics.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm leading-6 text-amber-900">
                  这一版重点不是更炫，而是让每个阶段都更像真实工作台里的专业判断面板。
                </p>
              </div>

              <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                <span>可与第一版 `/studio-demo` 直接对比</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
