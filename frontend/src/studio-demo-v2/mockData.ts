export type DemoV2Stage = 'scope' | 'prompt' | 'render'
export type DraftUsageLabel = '封面主图' | '方法总览' | '实验补图'

export interface DemoV2Section {
  id: string
  title: string
  note: string
  selected: boolean
}

export interface DemoV2Draft {
  id: string
  name: string
  summary: string
  risk: string
  accepted: boolean
}

export interface DemoV2Asset {
  id: string
  title: string
  ratio: string
  spec: string
}

export const DEMO_V2_STAGE_META: Record<
  DemoV2Stage,
  { label: string; navLabel: string; objective: string; reviewHint: string }
> = {
  scope: {
    label: 'Scope 设计',
    navLabel: 'Scope 设计',
    objective: '先锁定输入来源、推荐范围与手动微调结果，再进入草案评审。',
    reviewHint: '这一层只做“输入边界”判断，不引入图像参数。',
  },
  prompt: {
    label: 'Prompt 评审',
    navLabel: 'Prompt 评审',
    objective: '把候选草案拆成质量、用途、风险和保留集四个判断面板。',
    reviewHint: '把“接受/跳过”扩展成更接近真实工作流的策展动作。',
  },
  render: {
    label: 'Render 提交',
    navLabel: 'Render 提交',
    objective: '把输出规格、成本预估、资产队列和提交确认分开处理。',
    reviewHint: '先做规格和预算确认，再执行最终提交。',
  },
}

export function createV2Sections(): DemoV2Section[] {
  return [
    {
      id: 's1',
      title: 'Method Overview',
      note: '核心方法总览，适合作为主图结构来源。',
      selected: true,
    },
    {
      id: 's2',
      title: 'Multimodal Fusion Block',
      note: '强调交互关系，适合作为模块详解副图。',
      selected: true,
    },
    {
      id: 's3',
      title: 'Ablation Results',
      note: '可用于补充对比分析，但不建议优先进入主图。',
      selected: false,
    },
  ]
}

export function createV2Drafts(): DemoV2Draft[] {
  return [
    {
      id: 'd1',
      name: '草案 A',
      summary: '整体方法总览图，适合作为论文核心示意。',
      risk: '需要控制模块数量，避免画面过载。',
      accepted: true,
    },
    {
      id: 'd2',
      name: '草案 B',
      summary: '跨模态融合流程图，强调时序与信息流。',
      risk: '如果颜色过多，可能弱化主层级。',
      accepted: false,
    },
    {
      id: 'd3',
      name: '草案 C',
      summary: '实验设置补图，更适合论文附录或补充材料。',
      risk: '价值较低，不建议进入首轮渲染。',
      accepted: false,
    },
  ]
}

export function createV2Assets(): DemoV2Asset[] {
  return [
    {
      id: 'a1',
      title: '整体方法总览图',
      ratio: '16:9',
      spec: '2K',
    },
    {
      id: 'a2',
      title: '跨模态融合流程图',
      ratio: '4:3',
      spec: '2K',
    },
  ]
}
