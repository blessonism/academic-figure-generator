import { useState } from 'react'

import {
  DEMO_STAGE_META,
  createDemoDrafts,
  createDemoRenderAssets,
  createDemoSections,
  type DemoDraft,
  type DemoRenderAsset,
  type DemoSection,
  type DemoStage,
} from './mockData'

type CompletionState = {
  title: string
  detail: string
} | null

const getDraftSnapshot = (drafts: DemoDraft[]) =>
  Object.fromEntries(drafts.map((draft) => [draft.id, draft.status]))

function cloneSections(): DemoSection[] {
  return createDemoSections().map((item) => ({ ...item }))
}

function cloneDrafts(): DemoDraft[] {
  return createDemoDrafts().map((item) => ({ ...item }))
}

function cloneAssets(): DemoRenderAsset[] {
  return createDemoRenderAssets().map((item) => ({ ...item }))
}

export function useStudioDemoState() {
  const [currentStage, setCurrentStage] = useState<DemoStage>('scope')
  const [contextOpen, setContextOpen] = useState(true)
  const [sections, setSections] = useState<DemoSection[]>(() => cloneSections())
  const [scopeConfirmed, setScopeConfirmed] = useState(false)
  const [drafts, setDrafts] = useState<DemoDraft[]>(() => cloneDrafts())
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState<Record<string, DemoDraft['status']>>(() =>
    getDraftSnapshot(cloneDrafts()),
  )
  const [renderAssets, setRenderAssets] = useState<DemoRenderAsset[]>(() => cloneAssets())
  const [completion, setCompletion] = useState<CompletionState>(null)

  const selectedSectionCount = sections.filter((section) => section.selected).length
  const acceptedDraftCount = drafts.filter((draft) => draft.status === 'accepted').length
  const pendingDraftChanges = drafts.some((draft) => savedDraftSnapshot[draft.id] !== draft.status)
  const queuedAssetCount = renderAssets.filter((asset) => asset.status === 'queued').length
  const totalRenderCost = renderAssets.reduce((total, asset) => total + Number(asset.cost.replace('¥', '')), 0)

  const stageMeta = DEMO_STAGE_META[currentStage]

  const toggleSection = (sectionId: string) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, selected: !section.selected } : section,
      ),
    )
    setCompletion(null)
  }

  const confirmScope = () => {
    setScopeConfirmed(true)
    setCompletion({
      title: '范围已确认',
      detail: `已锁定 ${selectedSectionCount} 个章节，下一步可以开始筛选 Prompt 草案。`,
    })
  }

  const updateDraftStatus = (draftId: string, status: DemoDraft['status']) => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === draftId ? { ...draft, status } : draft)),
    )
    setCompletion(null)
  }

  const saveDraftDecisions = () => {
    setSavedDraftSnapshot(getDraftSnapshot(drafts))
    setCompletion({
      title: '草案决策已保存',
      detail: `当前共保留 ${acceptedDraftCount} 条草案，可以继续进入生成配图阶段。`,
    })
  }

  const submitRenderQueue = () => {
    setRenderAssets((current) =>
      current.map((asset) => ({ ...asset, status: 'queued' })),
    )
    setCompletion({
      title: '生成任务已提交',
      detail: `已提交 ${renderAssets.length} 张图片，预估总成本 ¥${totalRenderCost.toFixed(2)}。`,
    })
  }

  const resetDemo = () => {
    const nextDrafts = cloneDrafts()

    setCurrentStage('scope')
    setContextOpen(true)
    setSections(cloneSections())
    setScopeConfirmed(false)
    setDrafts(nextDrafts)
    setSavedDraftSnapshot(getDraftSnapshot(nextDrafts))
    setRenderAssets(cloneAssets())
    setCompletion(null)
  }

  const stageSummary = {
    scope: [
      `已选章节 ${selectedSectionCount} / ${sections.length}`,
      scopeConfirmed ? '范围已确认，可继续草案阶段' : '尚未确认本轮参考范围',
    ],
    prompt: [
      `已接受草案 ${acceptedDraftCount} / ${drafts.length}`,
      pendingDraftChanges ? '存在未保存的草案决策' : '草案状态已保存',
    ],
    render: [
      `待生成图片 ${renderAssets.length} 张`,
      queuedAssetCount > 0 ? `已进入队列 ${queuedAssetCount} 张` : '尚未提交生成任务',
    ],
  } satisfies Record<DemoStage, string[]>

  return {
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
  }
}
