import type { StudioScopePresetId, StudioStage } from './types';

export const STUDIO_STAGE_ORDER: StudioStage[] = ['ingest', 'scope', 'prompt', 'render', 'review'];

export const STUDIO_STAGE_LABELS: Record<StudioStage, string> = {
  ingest: '准备论文',
  scope: '确认范围',
  prompt: '生成草案',
  render: '生成配图',
  review: '精修交付',
};

export const STUDIO_STAGE_OBJECTIVES: Record<StudioStage, string> = {
  ingest: '先确认输入与解析是否就绪，为后续范围设计准备可靠材料。',
  scope: '收敛本轮参考范围，把推荐章节与人工判断合并成可执行输入。',
  prompt: '围绕已确认范围评审草案，保留值得继续出图的候选方案。',
  render: '先确认参数、成本和资产队列，再提交正式生成动作。',
  review: '围绕版本流完成精修、下载和最终稿交付确认。',
};

export const STUDIO_SCOPE_PRESET_LABELS: Record<StudioScopePresetId, string> = {
  'full-paper': '整篇论文',
  'methods-models': '方法与模型',
  'experiments-results': '实验与结果',
  recommended: '智能推荐章节',
  custom: '自定义范围',
};
