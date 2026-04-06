import { useMemo, useState } from 'react'

import {
  DEMO_V2_STAGE_META,
  createV2Assets,
  createV2Drafts,
  createV2Sections,
  type DemoV2Asset,
  type DemoV2Draft,
  type DemoV2Section,
  type DemoV2Stage,
  type DraftUsageLabel,
} from './mockData'

function cloneSections(): DemoV2Section[] {
  return createV2Sections().map((item) => ({ ...item }))
}

function cloneDrafts(): DemoV2Draft[] {
  return createV2Drafts().map((item) => ({ ...item }))
}

function cloneAssets(): DemoV2Asset[] {
  return createV2Assets().map((item) => ({ ...item }))
}

export function useStudioDemoV2State() {
  const [stage, setStage] = useState<DemoV2Stage>('scope')
  const [sections, setSections] = useState<DemoV2Section[]>(() => cloneSections())
  const [recommendedPreset, setRecommendedPreset] = useState('methods-models')
  const [drafts, setDrafts] = useState<DemoV2Draft[]>(() => cloneDrafts())
  const [usageLabel, setUsageLabel] = useState<DraftUsageLabel>('封面主图')
  const [spec, setSpec] = useState<'2K' | '4K'>('2K')
  const [assets] = useState<DemoV2Asset[]>(() => cloneAssets())
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false)

  const selectedSections = sections.filter((section) => section.selected)
  const acceptedDrafts = drafts.filter((draft) => draft.accepted)
  const estimatedCost = spec === '4K' ? 7.2 : 3.6

  const summaryMetrics = useMemo(
    () => [
      { label: '已选章节', value: `${selectedSections.length}` },
      { label: '保留草案', value: `${acceptedDrafts.length}` },
      { label: '当前规格', value: spec },
      { label: '估算成本', value: `¥${estimatedCost.toFixed(2)}` },
    ],
    [acceptedDrafts.length, estimatedCost, selectedSections.length, spec],
  )

  const toggleSection = (sectionId: string) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, selected: !section.selected } : section,
      ),
    )
  }

  const toggleDraftAcceptance = (draftId: string) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId ? { ...draft, accepted: !draft.accepted } : draft,
      ),
    )
  }

  const switchTo4K = () => {
    setSpec('4K')
    setSubmissionConfirmed(false)
  }

  const confirmSubmission = () => {
    setSubmissionConfirmed(true)
  }

  const resetV2Demo = () => {
    setStage('scope')
    setSections(cloneSections())
    setRecommendedPreset('methods-models')
    setDrafts(cloneDrafts())
    setUsageLabel('封面主图')
    setSpec('2K')
    setSubmissionConfirmed(false)
  }

  return {
    acceptedDrafts,
    assets,
    drafts,
    estimatedCost,
    meta: DEMO_V2_STAGE_META[stage],
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
  }
}
