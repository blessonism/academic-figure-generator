import type { StudioScopePresetId, StudioStage } from './types';

export const STUDIO_STAGE_ORDER: StudioStage[] = ['ingest', 'scope', 'prompt', 'render', 'review'];

export const STUDIO_STAGE_LABELS: Record<StudioStage, string> = {
  ingest: '准备论文',
  scope: '确认范围',
  prompt: '生成草案',
  render: '生成配图',
  review: '精修交付',
};

export const STUDIO_SCOPE_PRESET_LABELS: Record<StudioScopePresetId, string> = {
  'full-paper': '整篇论文',
  'methods-models': '方法与模型',
  'experiments-results': '实验与结果',
  recommended: '智能推荐章节',
  custom: '自定义范围',
};
