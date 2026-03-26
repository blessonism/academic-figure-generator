import type { StudioStage } from './types';

export const STUDIO_STAGE_ORDER: StudioStage[] = ['ingest', 'scope', 'prompt', 'render', 'review'];

export const STUDIO_STAGE_LABELS: Record<StudioStage, string> = {
  ingest: '准备论文',
  scope: '确认范围',
  prompt: '生成草案',
  render: '生成配图',
  review: '精修交付',
};
