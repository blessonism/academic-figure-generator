export type DemoStage = 'scope' | 'prompt' | 'render'

export interface DemoSection {
  id: string
  title: string
  summary: string
  selected: boolean
}

export interface DemoDraft {
  id: string
  title: string
  focus: string
  rationale: string
  status: 'pending' | 'accepted' | 'skipped'
}

export interface DemoRenderAsset {
  id: string
  title: string
  ratio: string
  resolution: string
  cost: string
  status: 'ready' | 'queued'
}

export const DEMO_STAGE_META: Record<
  DemoStage,
  { label: string; eyebrow: string; title: string; description: string; summary: string }
> = {
  scope: {
    label: '范围确认',
    eyebrow: 'Stage 01',
    title: '确认这次用于生成配图的论文范围',
    description: '先收窄论文范围，再进入草案生成，避免一开始就把整篇论文压给用户做判断。',
    summary: '确认输入来源、章节数量与本次参考边界。',
  },
  prompt: {
    label: 'Prompt 草案',
    eyebrow: 'Stage 02',
    title: '筛选值得继续出图的候选草案',
    description: '默认聚焦少量高质量候选，帮助用户更快做出“继续 / 跳过”的判断。',
    summary: '查看候选草案、筛选保留项并保存本轮决策。',
  },
  render: {
    label: '生成配图',
    eyebrow: 'Stage 03',
    title: '确认参数并提交生成任务',
    description: '把复杂参数收束到一个主动作中，让用户更容易理解成本、比例和输出预期。',
    summary: '核对默认参数、预算估算与待生成资产。',
  },
}

export function createDemoSections(): DemoSection[] {
  return [
    {
      id: 'sec-1',
      title: '1. Introduction',
      summary: '定义问题背景与任务目标，适合作为整体架构图的背景说明。',
      selected: true,
    },
    {
      id: 'sec-2',
      title: '3. Method',
      summary: '包含核心网络结构与模块关系，是本轮重点参考区域。',
      selected: true,
    },
    {
      id: 'sec-3',
      title: '4. Experiment Setup',
      summary: '包含实验流程和评估协议，可视情况用于流程型配图。',
      selected: false,
    },
    {
      id: 'sec-4',
      title: '5. Ablation Results',
      summary: '适合辅助生成对比型或消融分析类图示。',
      selected: true,
    },
  ]
}

export function createDemoDrafts(): DemoDraft[] {
  return [
    {
      id: 'draft-01',
      title: '草案 01',
      focus: '整体架构总览图',
      rationale: '最适合作为论文主图，能概括编码器、跨模态融合和输出头的关系。',
      status: 'pending',
    },
    {
      id: 'draft-02',
      title: '草案 02',
      focus: '跨模态对齐流程图',
      rationale: '适合补充方法细节，但优先级低于整体架构。',
      status: 'pending',
    },
    {
      id: 'draft-03',
      title: '草案 03',
      focus: '消融对比图',
      rationale: '更适合论文实验部分，而不是首页主视觉。',
      status: 'skipped',
    },
  ]
}

export function createDemoRenderAssets(): DemoRenderAsset[] {
  return [
    {
      id: 'asset-01',
      title: '整体架构总览图',
      ratio: '16:9',
      resolution: '2K',
      cost: '¥1.80',
      status: 'ready',
    },
    {
      id: 'asset-02',
      title: '跨模态对齐流程图',
      ratio: '4:3',
      resolution: '2K',
      cost: '¥1.80',
      status: 'ready',
    },
  ]
}
